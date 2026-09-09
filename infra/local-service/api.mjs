import { randomUUID } from 'node:crypto'
import { createConnection } from 'node:net'
import { createServer } from 'node:http'
import { hasPermission, listDevelopmentUsers, login, requireAuth } from './auth.mjs'
import { searchSyntheticCandidates, validateFilters } from './search.mjs'
import { providerHealth, providerRegistry, normalizePublicUrl, ingestPublicUrl, searchGithubProfiles } from './providers.mjs'
import { redisCommand } from './redis.mjs'
import { docsHtml, openapi } from './openapi.mjs'
import { parseJobDescription, scanJobDescription, validateJobDescription } from './jd.mjs'
import { extractDocumentText } from './document-extract.mjs'
import { scoreCandidate } from './ats.mjs'
import { findPotentialDuplicates, normalizeCandidateProfile } from './intelligence.mjs'
import { validateReviewUpdate } from './workflow.mjs'
import { exportCandidates } from './exports.mjs'
import { compareCandidates } from './comparison.mjs'
import { deletionPlan, sameOrganization } from './governance.mjs'
import { incrementMetric, metricsSnapshot } from './observability.mjs'
import { buildWritebackPayload } from './integrations.mjs'

const port = Number(process.env.API_PORT || 3001)
const databaseHost = process.env.DATABASE_HOST || 'postgres'
const databasePort = Number(process.env.DATABASE_PORT || 5432)
const redisHost = process.env.REDIS_HOST || 'redis'
const redisPort = Number(process.env.REDIS_PORT || 6379)

function canConnect(host, port) {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port })
    const finish = (healthy) => {
      socket.destroy()
      resolve(healthy)
    }
    socket.setTimeout(500)
    socket.once('connect', () => finish(true))
    socket.once('timeout', () => finish(false))
    socket.once('error', () => finish(false))
  })
}

async function readiness() {
  const [database, redis] = await Promise.all([
    canConnect(databaseHost, databasePort),
    canConnect(redisHost, redisPort),
  ])
  return { database, redis, ready: database && redis }
}

function json(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json', 'access-control-allow-origin': 'http://localhost:3000', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS' })
  response.end(JSON.stringify(body))
}

const demoCandidates = [
  { id: 'demo-aurora-1', name: 'Demo Candidate Aurora', title: 'Data Engineer', skills: ['Python', 'SQL', 'Spark'], experienceYears: 6, education: "Bachelor's degree", location: 'Riyadh, Saudi Arabia', locationClassification: 'Saudi Arabia', relocation: false, confidence: 'High' },
  { id: 'demo-orbit-2', name: 'Demo Candidate Orbit', title: 'Senior Data Engineer', skills: ['Python', 'SQL', 'Airflow'], experienceYears: 8, education: "Master's degree", location: 'Jeddah, Saudi Arabia', locationClassification: 'Saudi Arabia', relocation: false, confidence: 'High' },
  { id: 'demo-lumen-3', name: 'Demo Candidate Lumen', title: 'Analytics Engineer', skills: ['SQL', 'dbt', 'Python'], experienceYears: 4, education: "Bachelor's degree", location: 'Remote, outside Saudi Arabia', locationClassification: 'Outside Saudi Arabia', relocation: true, confidence: 'Medium' },
]

function candidateSearch(body) {
  const errors = []
  if (!body || typeof body.role !== 'string' || !body.role.trim()) errors.push('role_required')
  if (!Array.isArray(body?.skills) || body.skills.some((skill) => typeof skill !== 'string' || !skill.trim())) errors.push('skills_array_required')
  if (!Number.isInteger(body?.experienceMin) || body.experienceMin < 0) errors.push('experience_min_invalid')
  if (!Number.isInteger(body?.experienceMax) || body.experienceMax < body.experienceMin) errors.push('experience_max_invalid')
  if (typeof body?.location !== 'string' || !body.location.trim()) errors.push('location_required')
  if (errors.length) return { errors }
  const role = body.role.toLowerCase()
  const skills = body.skills.map((skill) => skill.toLowerCase())
  return { candidates: demoCandidates.map((candidate) => {
    const matchedSkills = candidate.skills.filter((skill) => skills.includes(skill.toLowerCase()))
    const missingSkills = body.skills.filter((skill) => !candidate.skills.some((item) => item.toLowerCase() === skill.toLowerCase()))
    const roleMatch = candidate.title.toLowerCase().includes(role) || role.includes(candidate.title.toLowerCase().split(' ')[0])
    const experienceMatch = candidate.experienceYears >= body.experienceMin && candidate.experienceYears <= body.experienceMax
    const geographyMatch = candidate.locationClassification.toLowerCase() === body.location.toLowerCase() || candidate.relocation
    const score = Math.min(100, Math.round((matchedSkills.length / Math.max(skills.length, 1)) * 45 + (roleMatch ? 20 : 0) + (experienceMatch ? 15 : 0) + (candidate.education ? 10 : 0) + (geographyMatch ? 10 : 0)))
    return { ...candidate, demo: true, label: 'Synthetic demo candidate', atsScore: score, matchedSkills, missingSkills, explanation: `${matchedSkills.length} of ${skills.length} required skills matched; ${roleMatch ? 'role matches' : 'adjacent role'}; ${experienceMatch ? 'experience is in range' : 'experience is outside range'}; ${geographyMatch ? 'geography is compatible' : 'geography differs'}.` }
  }).sort((a, b) => b.atsScore - a.atsScore) }
}

async function requestBody(request) {
  let body = ''
  for await (const chunk of request) body += chunk
  try { return JSON.parse(body || '{}') } catch { return null }
}

const server = createServer(async (request, response) => {
  incrementMetric('api.requests')
  if (request.method === 'OPTIONS') { response.writeHead(204, { 'access-control-allow-origin': 'http://localhost:3000', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET,POST,DELETE,OPTIONS' }); response.end(); return }
  if (request.url === '/health') {
    json(response, 200, { status: 'ok', service: 'api', mode: 'local-placeholder' })
    return
  }
  if (request.url === '/openapi.json') return json(response, 200, openapi)
  if (request.url === '/docs') { response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); response.end(docsHtml()); return }
  if (request.url === '/metrics') {
    const user = requireAuth(request)
    if (!user || !hasPermission(user, 'organization:manage')) return json(response, 403, { error: 'forbidden', required: 'organization:manage' })
    return json(response, 200, { service: 'api', metrics: metricsSnapshot() })
  }

  if (request.method === 'GET' && request.url.startsWith('/api/v1/providers/github/search')) {
    const user = requireAuth(request)
    if (!user || !hasPermission(user, 'search:run')) return json(response, 403, { error: 'forbidden', required: 'search:run' })
    const query = new URL(request.url, 'http://localhost').searchParams.get('q')
    try { return json(response, 200, { organizationId: user.organizationId, provider: 'github_public_api', live: true, candidates: await searchGithubProfiles(query) }) } catch (error) { return json(response, 502, { error: error.message, provider: 'github_public_api' }) }
  }

  if (request.url === '/ready' || request.url === '/api/v1/health') {
    const status = await readiness()
    json(response, status.ready ? 200 : 503, { service: 'api', ...status })
    return
  }

  if (request.method === 'POST' && request.url === '/api/v1/candidate-search') {
    const result = candidateSearch(await requestBody(request))
    if (result.errors) return json(response, 400, { error: 'invalid_candidate_search', details: result.errors })
    return json(response, 200, { demo: true, label: 'Synthetic demo candidates', candidates: result.candidates })
  }

  if (request.method === 'POST' && request.url === '/api/v1/auth/login') {
    const body = await requestBody(request)
    const result = body && login(body.email, body.password)
    if (!result) return json(response, 401, { error: 'invalid_development_credentials' })
    return json(response, 200, result)
  }

  if (request.url === '/api/v1/auth/development-users') {
    if (process.env.DEV_AUTH_ENABLED !== 'true') return json(response, 404, { error: 'not_found' })
    return json(response, 200, { users: listDevelopmentUsers(), password: 'local-dev' })
  }

  const user = requireAuth(request)
  if (!user) { incrementMetric('api.auth_failures'); return json(response, 401, { error: 'authentication_required' }) }

  if (request.url === '/api/v1/me') return json(response, 200, { user })
  if (request.url === '/api/v1/organization') {
    if (!hasPermission(user, 'organization:manage')) return json(response, 403, { error: 'forbidden', required: 'organization:manage' })
    return json(response, 200, { organization: { id: user.organizationId, name: 'Demo Recruiting Group', slug: 'demo-recruiting-group' } })
  }
  if (request.url === '/api/v1/candidates') {
    if (!hasPermission(user, 'candidate:read')) return json(response, 403, { error: 'forbidden', required: 'candidate:read' })
    const candidates = searchSyntheticCandidates({}, user.organizationId)
    return json(response, 200, { organizationId: user.organizationId, candidates, isolation: 'organization-scoped', sourceCoverage: [{ sourceType: 'synthetic_local', status: 'complete', resultCount: candidates.length }] })
  }
  if (request.url === '/api/v1/providers') {
    if (!hasPermission(user, 'organization:manage')) return json(response, 403, { error: 'forbidden', required: 'organization:manage' })
    return json(response, 200, { providers: providerRegistry() })
  }
  if (request.url === '/api/v1/providers/health') return json(response, 200, { providers: await providerHealth() })
  if (request.method === 'POST' && request.url === '/api/v1/providers/ingest') {
    if (!hasPermission(user, 'candidate:read')) return json(response, 403, { error: 'forbidden', required: 'candidate:read' })
    const body = await requestBody(request)
    if (!body || typeof body.url !== 'string') return json(response, 400, { error: 'public_url_required' })
    try { const result = await ingestPublicUrl(body.url); return json(response, 200, { organizationId: user.organizationId, candidate: result }) } catch (error) { return json(response, 422, { error: error.message }) }
  }
  if (request.method === 'POST' && request.url === '/api/v1/job-descriptions') {
    if (!hasPermission(user, 'search:run')) return json(response, 403, { error: 'forbidden', required: 'search:run' })
    const body = await requestBody(request)
    const filename = typeof body?.filename === 'string' ? body.filename : ''
    const content = typeof body?.content === 'string' ? body.content : ''
    const encoded = filename.toLowerCase().endsWith('.pdf') || filename.toLowerCase().endsWith('.docx')
    const errors = validateJobDescription(filename, content, encoded)
    if (errors.length) return json(response, 400, { error: 'invalid_job_description', details: errors })
    const scan = scanJobDescription(content)
    if (!scan.clean) return json(response, 422, { error: scan.reason, scan })
    try {
      const extractedText = encoded ? extractDocumentText(filename, content) : content.trim()
      const requirementProfile = parseJobDescription(extractedText)
      const historyKey = `job-descriptions:${user.organizationId}`
      const previousVersions = await redisCommand(['LRANGE', historyKey, '0', '-1'])
      const version = { id: randomUUID(), organizationId: user.organizationId, filename, version: (previousVersions || []).length + 1, extractedText, requirementProfile, parserVersion: requirementProfile.parserVersion, scan, createdAt: new Date().toISOString() }
      await redisCommand(['SET', `job-description:${version.id}`, JSON.stringify(version)])
      await redisCommand(['RPUSH', historyKey, version.id])
      return json(response, 201, version)
    } catch (error) { return json(response, 422, { error: error.message }) }
  }
  if (request.url === '/api/v1/job-descriptions' && request.method === 'GET') {
    if (!hasPermission(user, 'search:run')) return json(response, 403, { error: 'forbidden', required: 'search:run' })
    try {
      const ids = await redisCommand(['LRANGE', `job-descriptions:${user.organizationId}`, '0', '-1'])
      const versions = []
      for (const id of ids || []) { const raw = await redisCommand(['GET', `job-description:${id}`]); if (raw) versions.push(JSON.parse(raw)) }
      return json(response, 200, { organizationId: user.organizationId, versions })
    } catch { return json(response, 500, { error: 'job_description_store_unavailable' }) }
  }
  if (request.method === 'POST' && request.url === '/api/v1/ats/score') {
    if (!hasPermission(user, 'candidate:read')) return json(response, 403, { error: 'forbidden', required: 'candidate:read' })
    const body = await requestBody(request)
    if (!body || typeof body.candidate !== 'object' || typeof body.requirementProfile !== 'object') return json(response, 400, { error: 'candidate_and_requirement_profile_required' })
    try { return json(response, 200, { organizationId: user.organizationId, result: scoreCandidate(body.candidate, body.requirementProfile) }) } catch (error) { return json(response, 422, { error: error.message }) }
  }
  if (request.method === 'POST' && request.url === '/api/v1/candidate-intelligence/extract') {
    if (!hasPermission(user, 'candidate:read')) return json(response, 403, { error: 'forbidden', required: 'candidate:read' })
    const body = await requestBody(request)
    if (!body || typeof body.profile !== 'object') return json(response, 400, { error: 'profile_required' })
    const candidate = normalizeCandidateProfile(body.profile, body.source)
    return json(response, 201, { organizationId: user.organizationId, candidate })
  }
  if (request.method === 'POST' && request.url === '/api/v1/candidate-intelligence/duplicates') {
    if (!hasPermission(user, 'candidate:read')) return json(response, 403, { error: 'forbidden', required: 'candidate:read' })
    const body = await requestBody(request)
    if (!body || !Array.isArray(body.candidates)) return json(response, 400, { error: 'candidates_array_required' })
    return json(response, 200, { organizationId: user.organizationId, potentialDuplicates: findPotentialDuplicates(body.candidates) })
  }
  if (request.method === 'POST' && request.url === '/api/v1/reviews') {
    if (!hasPermission(user, 'candidate:shortlist')) return json(response, 403, { error: 'forbidden', required: 'candidate:shortlist' })
    const body = await requestBody(request); const errors = validateReviewUpdate(body || {})
    if (errors.length) return json(response, 400, { error: 'invalid_review_update', details: errors })
    const review = { ...body, organizationId: user.organizationId, updatedBy: user.id, updatedAt: new Date().toISOString() }
    await redisCommand(['SET', `review:${user.organizationId}:${body.candidateId}`, JSON.stringify(review)])
    await redisCommand(['RPUSH', 'audit-events', JSON.stringify({ eventType: 'candidate.review_updated', ...review })])
    return json(response, 200, review)
  }
  const reviewMatch = request.url.match(/^\/api\/v1\/reviews\/([^/]+)$/)
  if (request.method === 'GET' && reviewMatch) {
    if (!hasPermission(user, 'shortlist:read')) return json(response, 403, { error: 'forbidden', required: 'shortlist:read' })
    const raw = await redisCommand(['GET', `review:${user.organizationId}:${reviewMatch[1]}`])
    return raw ? json(response, 200, JSON.parse(raw)) : json(response, 404, { error: 'review_not_found' })
  }
  if (request.method === 'DELETE' && reviewMatch) {
    if (!hasPermission(user, 'organization:manage')) return json(response, 403, { error: 'forbidden', required: 'organization:manage' })
    const plan = deletionPlan({ organizationId: user.organizationId, candidateId: reviewMatch[1] })
    if (!sameOrganization(user, plan.organizationId)) return json(response, 404, { error: 'review_not_found' })
    await redisCommand(['DEL', ...plan.keys])
    await redisCommand(['RPUSH', 'audit-events', JSON.stringify({ ...plan, deletedBy: user.id, createdAt: new Date().toISOString() })])
    return json(response, 200, { deleted: true, candidateId: reviewMatch[1], organizationId: user.organizationId })
  }
  if (request.method === 'GET' && request.url === '/api/v1/audit-events') {
    if (!hasPermission(user, 'audit:read')) return json(response, 403, { error: 'forbidden', required: 'audit:read' })
    const records = await redisCommand(['LRANGE', 'audit-events', '0', '-1'])
    const events = (records || []).map(record => JSON.parse(record)).filter(event => event.organizationId === user.organizationId)
    return json(response, 200, { organizationId: user.organizationId, events })
  }
  if (request.method === 'POST' && request.url === '/api/v1/integrations/writeback/preview') {
    if (!hasPermission(user, 'candidate:shortlist')) return json(response, 403, { error: 'forbidden', required: 'candidate:shortlist' })
    const body = await requestBody(request)
    try {
      const payload = buildWritebackPayload({ ...body, confirmedBy: user.id })
      await redisCommand(['RPUSH', 'audit-events', JSON.stringify({ eventType: 'integration.writeback_previewed', organizationId: user.organizationId, ...payload })])
      return json(response, 200, { organizationId: user.organizationId, payload })
    } catch (error) { return json(response, 400, { error: error.message }) }
  }
  if (request.method === 'POST' && request.url === '/api/v1/exports/candidates') {
    if (!hasPermission(user, 'candidate:read')) return json(response, 403, { error: 'forbidden', required: 'candidate:read' })
    const body = await requestBody(request); const format = body?.format || 'json'
    if (!Array.isArray(body?.candidates)) return json(response, 400, { error: 'candidates_array_required' })
    try { const result = exportCandidates(body.candidates, format); await redisCommand(['RPUSH', 'audit-events', JSON.stringify({ eventType: 'candidate.exported', organizationId: user.organizationId, userId: user.id, format, candidateCount: body.candidates.length, createdAt: new Date().toISOString() })]); response.writeHead(200, { 'content-type': result.contentType, 'content-disposition': `attachment; filename=candidates.${format}` }); response.end(result.body) } catch (error) { return json(response, 400, { error: error.message }) }
  }
  if (request.method === 'POST' && request.url === '/api/v1/candidates/compare') {
    if (!hasPermission(user, 'candidate:read')) return json(response, 403, { error: 'forbidden', required: 'candidate:read' })
    const body = await requestBody(request)
    if (!Array.isArray(body?.candidates) || body.candidates.length < 2) return json(response, 400, { error: 'at_least_two_candidates_required' })
    const candidates = compareCandidates(body.candidates)
    await redisCommand(['RPUSH', 'audit-events', JSON.stringify({ eventType: 'candidate.compared', organizationId: user.organizationId, userId: user.id, candidateIds: candidates.map(candidate => candidate.id), createdAt: new Date().toISOString() })])
    return json(response, 200, { organizationId: user.organizationId, candidates })
  }
  if (request.url === '/api/v1/sources') {
    if (!hasPermission(user, 'candidate:read')) return json(response, 403, { error: 'forbidden', required: 'candidate:read' })
    try {
      const records = await redisCommand(['LRANGE', 'source-records', '0', '-1'])
      const sources = (records || []).map((record) => JSON.parse(record)).filter((source) => source.organizationId === user.organizationId)
      return json(response, 200, { organizationId: user.organizationId, sources })
    } catch { return json(response, 500, { error: 'source_store_unavailable' }) }
  }
  if (request.method === 'POST' && request.url === '/api/v1/search-jobs') {
    if (!hasPermission(user, 'search:run')) return json(response, 403, { error: 'forbidden', required: 'search:run' })
    const body = await requestBody(request); if (!body || typeof body.filters !== 'object' || Array.isArray(body.filters)) return json(response, 400, { error: 'filters_object_required' })
    const errors = validateFilters(body.filters); if (errors.length) return json(response, 400, { error: 'invalid_filters', details: errors })
    const urls = Array.isArray(body.publicProfileUrls) ? body.publicProfileUrls : []
    const normalized = []; for (const url of urls) { try { normalized.push(await normalizePublicUrl(url)) } catch (error) { return json(response, 400, { error: error.message }) } }
    const jobId = randomUUID(); const job = { jobId, userId: user.id, organizationId: user.organizationId, filters: body.filters, publicProfileUrls: [...new Set(normalized)], status: 'queued', progress: 0, currentStage: 'queued', resultCount: 0, sourceCoverage: [], extractionMethod: null, createdAt: new Date().toISOString(), startedAt: null, completedAt: null }
    try { await redisCommand(['SET', `search-job:${jobId}`, JSON.stringify(job)]); await redisCommand(['RPUSH', 'search-jobs', jobId]); await redisCommand(['RPUSH', 'audit-events', JSON.stringify({ eventType: 'search.submitted', userId: user.id, organizationId: user.organizationId, jobId, createdAt: job.createdAt })]); return json(response, 202, job) } catch { return json(response, 500, { error: 'queue_unavailable' }) }
  }
  const jobMatch = request.url.match(/^\/api\/v1\/search-jobs\/([^/]+)$/)
  if (jobMatch && request.method === 'GET') { try { const raw = await redisCommand(['GET', `search-job:${jobMatch[1]}`]); if (!raw) return json(response, 404, { error: 'job_not_found' }); const job = JSON.parse(raw); if (job.organizationId !== user.organizationId) return json(response, 404, { error: 'job_not_found' }); return json(response, 200, job) } catch { return json(response, 500, { error: 'job_store_unavailable' }) } }
  if (request.method === 'POST' && request.url === '/api/v1/searches') {
    if (!hasPermission(user, 'search:run')) return json(response, 403, { error: 'forbidden', required: 'search:run' })
    const body = await requestBody(request)
    if (!body || typeof body.filters !== 'object' || Array.isArray(body.filters)) return json(response, 400, { error: 'filters_object_required' })
    const errors = validateFilters(body.filters)
    if (errors.length) return json(response, 400, { error: 'invalid_filters', details: errors })
    return json(response, 200, { organizationId: user.organizationId, filters: body.filters, count: searchSyntheticCandidates(body.filters, user.organizationId).length, candidates: searchSyntheticCandidates(body.filters, user.organizationId), sourceCoverage: [{ sourceType: 'synthetic_local', status: 'complete', resultCount: searchSyntheticCandidates(body.filters, user.organizationId).length }] })
  }

  json(response, 404, { error: 'not_found' })
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Candidate Finder API placeholder listening on ${port}`)
})
