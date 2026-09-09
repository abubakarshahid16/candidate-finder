import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { authenticateToken, hasPermission, login } from '../infra/local-service/auth.mjs'
import { parseJobDescription, scanJobDescription, validateJobDescription } from '../infra/local-service/jd.mjs'
import { scoreCandidate } from '../infra/local-service/ats.mjs'
import { findPotentialDuplicates, normalizeCandidateProfile } from '../infra/local-service/intelligence.mjs'
import { validateReviewUpdate } from '../infra/local-service/workflow.mjs'
import { exportCandidates } from '../infra/local-service/exports.mjs'
import { compareCandidates } from '../infra/local-service/comparison.mjs'
import { deletionPlan, sameOrganization } from '../infra/local-service/governance.mjs'
import { incrementMetric, metricsSnapshot, resetMetrics } from '../infra/local-service/observability.mjs'
import { buildWritebackPayload } from '../infra/local-service/integrations.mjs'
import { createCircuitBreaker, withRetry } from '../infra/local-service/resilience.mjs'
import { searchSyntheticCandidates, validateFilters } from '../infra/local-service/search.mjs'

test('local compose profile contains the required lightweight services', async () => {
  const compose = await readFile('docker-compose.local.yml', 'utf8')
  for (const service of ['postgres:', 'redis:', 'api:', 'worker:']) {
    assert.match(compose, new RegExp(`\\n  ${service.replace(':', '')}:`))
  }
  assert.match(compose, /pgvector\/pgvector:pg16/)
  assert.match(compose, /redis:7-alpine/)
  assert.match(compose, /healthcheck:/)
})

test('api and worker expose local health routes', async () => {
  const api = await readFile('infra/local-service/api.mjs', 'utf8')
  const worker = await readFile('infra/local-service/worker.mjs', 'utf8')
  assert.match(api, /request\.url === '\/health'/)
  assert.match(api, /request\.url === '\/ready'/)
  assert.match(worker, /request\.url === '\/health'/)
})

test('source provenance is persisted and exposed with organization filtering', async () => {
  const api = await readFile('infra/local-service/api.mjs', 'utf8')
  const worker = await readFile('infra/local-service/worker.mjs', 'utf8')
  assert.match(api, /request\.url === '\/api\/v1\/sources'/)
  assert.match(api, /organizationId === user\.organizationId/)
  assert.match(worker, /source-records/)
  assert.match(worker, /retrievedAt: result\.retrievedAt/)
})

test('job description foundation validates text and extracts job-relevant requirements', () => {
  assert.deepEqual(validateJobDescription('role.txt', 'Need a data engineer with 5 years of Python and Spark.'), [])
  assert.deepEqual(validateJobDescription('role.pdf', 'encoded-file', true), [])
  assert.ok(validateJobDescription('role.exe', 'text').includes('unsupported_file_type'))
  const profile = parseJobDescription('Need a data engineer with 5 years of Python, Spark, and SQL.')
  assert.equal(profile.role, 'data_engineer')
  assert.deepEqual(profile.skills, ['python', 'sql', 'spark'])
  assert.equal(profile.minimumExperienceYears, 5)
  assert.equal(scanJobDescription('normal job description').clean, true)
  assert.equal(scanJobDescription('EICAR-STANDARD-ANTIVIRUS-TEST-FILE').clean, false)
})

test('ATS scoring is deterministic and excludes protected traits', () => {
  const profile = { requirements: [{ type: 'skill', value: 'python', required: true }, { type: 'skill', value: 'spark', required: true }], minimumExperienceYears: 5 }
  const result = scoreCandidate({ skills: ['Python'], experienceYears: 6 }, profile)
  assert.equal(result.score, 65)
  assert.deepEqual(result.missingSkills, ['spark'])
  assert.equal(scoreCandidate({ skills: ['Python'], experienceYears: 6 }, profile).score, result.score)
  assert.throws(() => scoreCandidate({ skills: ['Python'], experienceYears: 6 }, { age: 30, requirements: [] }), /protected_field_not_allowed/)
})

test('candidate intelligence classifies location and preserves evidence provenance', () => {
  const candidate = normalizeCandidateProfile({ headline: 'Data Engineer', role: 'data_engineer', skills: ['python'], preferredLocation: 'Riyadh', locationClassification: 'saudi_arabia' }, { sourceUrl: 'https://example.test/profile', retrievedAt: '2026-09-09T00:00:00Z' })
  assert.equal(candidate.locationClassification, 'saudi_arabia')
  assert.equal(candidate.evidence.find(item => item.field === 'headline').sourceUrl, 'https://example.test/profile')
  assert.equal(normalizeCandidateProfile({ remote: true }).locationClassification, 'remote')
  assert.equal(normalizeCandidateProfile({ nationality: 'unknown' }).locationClassification, 'unknown')
})

test('duplicate detection produces reversible review candidates', () => {
  const duplicates = findPotentialDuplicates([{ id: 'a', displayName: 'Demo Aurora', currentRole: 'data_engineer' }, { id: 'b', displayName: 'Demo Aurora', currentRole: 'data_engineer' }])
  assert.equal(duplicates.length, 1)
  assert.deepEqual(duplicates[0].candidateIds, ['a', 'b'])
  assert.equal(duplicates[0].reversible, true)
})

test('recruiter workflow validates shortlist notes, tags, and review status', () => {
  assert.deepEqual(validateReviewUpdate({ candidateId: 'candidate-1', status: 'shortlisted', notes: 'Follow up', tags: ['priority'] }), [])
  assert.ok(validateReviewUpdate({ candidateId: 'candidate-1', status: 'unknown' }).includes('unsupported_review_status'))
  assert.ok(validateReviewUpdate({ status: 'shortlisted' }).includes('candidate_id_required'))
})

test('role permissions distinguish review writers, readers, and audit readers', () => {
  const recruiter = authenticateToken('dev-recruiter-token')
  const manager = authenticateToken('dev-manager-token')
  const admin = authenticateToken('dev-admin-token')
  assert.equal(hasPermission(recruiter, 'candidate:shortlist'), true)
  assert.equal(hasPermission(manager, 'candidate:shortlist'), false)
  assert.equal(hasPermission(manager, 'shortlist:read'), true)
  assert.equal(hasPermission(admin, 'audit:read'), true)
})

test('candidate exports preserve score and provenance in JSON and CSV', () => {
  const candidates = [{ id: 'a', name: 'Noura', role: 'data_engineer', score: 92, confidence: 'high', sourceUrl: 'https://example.test/a', retrievedAt: '2026-09-09', evidence: [{ field: 'role' }] }]
  const json = exportCandidates(candidates, 'json')
  assert.match(json.body, /https:\/\/example\.test\/a/)
  const csv = exportCandidates(candidates, 'csv')
  assert.match(csv.body, /id,name,role,score/)
  assert.match(csv.body, /"Noura"/)
})

test('candidate comparison preserves decision-relevant fields', () => {
  const result = compareCandidates([{ id: 'a', name: 'A', role: 'data_engineer', skills: ['python'], score: 90, sourceUrl: 'https://example.test/a' }, { id: 'b', name: 'B', role: 'data_engineer', skills: ['spark'], score: 80, sourceUrl: 'https://example.test/b' }])
  assert.equal(result.length, 2)
  assert.deepEqual(result.map(candidate => candidate.score), [90, 80])
  assert.equal(result[0].sourceUrl, 'https://example.test/a')
})

test('governance enforces tenant scope and produces explicit deletion plans', () => {
  const user = { organizationId: 'org-a' }
  assert.equal(sameOrganization(user, 'org-a'), true)
  assert.equal(sameOrganization(user, 'org-b'), false)
  assert.deepEqual(deletionPlan({ organizationId: 'org-a', candidateId: 'candidate-1' }), { organizationId: 'org-a', candidateId: 'candidate-1', keys: ['review:org-a:candidate-1'], auditEvent: 'candidate.data_deleted', reversible: false })
})

test('observability counters expose repeatable local metrics', () => {
  resetMetrics(); incrementMetric('api.requests'); incrementMetric('api.requests'); incrementMetric('worker.errors')
  assert.deepEqual(metricsSnapshot(), { 'api.requests': 2, 'worker.errors': 1 })
  resetMetrics()
})

test('provider resilience retries bounded failures and opens circuits', async () => {
  let attempts = 0
  const value = await withRetry(async () => { attempts += 1; if (attempts < 2) throw new Error('temporary'); return 'ok' }, { attempts: 3 })
  assert.equal(value, 'ok')
  assert.equal(attempts, 2)
  const breaker = createCircuitBreaker({ failureThreshold: 2, resetAfterMs: 10_000 })
  breaker.recordFailure(); breaker.recordFailure()
  assert.equal(breaker.state(), 'open')
  assert.equal(breaker.canRequest(), false)
})

test('recovery runbook covers health, restore, and tenant-isolation acceptance checks', async () => {
  const runbook = await readFile('docs/recovery-runbook.md', 'utf8')
  assert.match(runbook, /\/health/)
  assert.match(runbook, /restore PostgreSQL/i)
  assert.match(runbook, /tenant-isolation/i)
})

test('security review records protected-field, provenance, and production sign-off controls', async () => {
  const review = await readFile('docs/security-review.md', 'utf8')
  assert.match(review, /ATS scoring rejects age/i)
  assert.match(review, /retrieval timestamp/i)
  assert.match(review, /production launch remains conditional/i)
})

test('integration writeback requires confirmation and preserves provenance', () => {
  const payload = buildWritebackPayload({ candidate: { id: 'a', score: 90, sourceUrl: 'https://example.test/a' }, destination: 'ats', confirmedBy: 'user-1' })
  assert.equal(payload.mode, 'recruiter_confirmed_preview')
  assert.equal(payload.sourceUrl, 'https://example.test/a')
  assert.throws(() => buildWritebackPayload({ candidate: { id: 'a' }, destination: 'ats' }), /confirmed_writeback_required/)
})

test('request authentication can enforce MFA in production mode', async () => {
  const auth = await readFile('infra/local-service/auth.mjs', 'utf8')
  assert.match(auth, /REQUIRE_MFA/)
  assert.match(auth, /x-mfa-verified/)
})

test('service-account API-key authentication is environment controlled', async () => {
  const auth = await readFile('infra/local-service/auth.mjs', 'utf8')
  assert.match(auth, /SERVICE_API_KEY/)
  assert.match(auth, /serviceAccount: true/)
})

test('development credentials are disabled by default in production', async () => {
  const auth = await readFile('infra/local-service/auth.mjs', 'utf8')
  assert.match(auth, /NODE_ENV === 'production'/)
  assert.match(auth, /ALLOW_DEV_AUTH !== 'true'/)
})

test('environment contract includes production authentication controls', async () => {
  const env = await readFile('.env.example', 'utf8')
  assert.match(env, /REQUIRE_MFA=/)
  assert.match(env, /SERVICE_API_KEY=/)
  assert.match(env, /ALLOW_DEV_AUTH=/)
})

test('development authentication returns role-scoped organization context', () => {
  const recruiter = login('recruiter@example.test', 'local-dev')
  const admin = authenticateToken('dev-admin-token')
  assert.equal(recruiter.user.role, 'recruiter')
  assert.equal(recruiter.user.organizationId, '00000000-0000-0000-0000-000000000001')
  assert.equal(hasPermission(recruiter.user, 'candidate:read'), true)
  assert.equal(hasPermission(recruiter.user, 'organization:manage'), false)
  assert.equal(hasPermission(admin, 'organization:manage'), true)
  assert.equal(login('recruiter@example.test', 'wrong-password'), null)
})

test('taxonomy module contains controlled search dimensions and safety exclusions', async () => {
  const source = await readFile('packages/domain/taxonomies.ts', 'utf8')
  assert.match(source, /export const industries/)
  assert.match(source, /export const roles/)
  assert.match(source, /export const skills/)
  assert.match(source, /export const educationLevels/)
  assert.match(source, /export const geographyClassifications/)
  assert.match(source, /saudi_arabia/)
  assert.match(source, /outside_saudi_arabia/)
  assert.match(source, /willing_to_relocate/)
  assert.match(source, /export function resolveTaxonomyItem/)
  assert.doesNotMatch(source, /age_or_dob|date_of_birth|gender|nationality\s*:/)
})

test('structured search validates and filters synthetic candidates', () => {
  assert.deepEqual(validateFilters({ role: 'data_engineer', mustHaveSkills: ['python'], minExperience: 5 }), [])
  assert.equal(searchSyntheticCandidates({ geography: 'saudi_arabia' }, 'org-demo').length, 1)
  assert.equal(searchSyntheticCandidates({ geography: 'willing_to_relocate' }, 'org-demo').length, 1)
  assert.equal(searchSyntheticCandidates({ mustHaveSkills: ['spark'] }, 'org-demo').length, 2)
  assert.ok(validateFilters({ role: 'not-a-role' }).length > 0)
  assert.ok(validateFilters({ minExperience: 8, maxExperience: 3 }).length > 0)
})
