import assert from 'node:assert/strict'
import test from 'node:test'
import { docsHtml, openapi } from '../infra/local-service/openapi.mjs'

test('OpenAPI documentation covers the local backend surface', () => {
  assert.equal(openapi.openapi, '3.0.3')
  for (const path of ['/api/v1/auth/login', '/api/v1/search-jobs', '/api/v1/providers/ingest', '/api/v1/ats/score', '/api/v1/audit-events']) assert.ok(openapi.paths[path])
  assert.match(docsHtml(), /Candidate Finder API/)
})
