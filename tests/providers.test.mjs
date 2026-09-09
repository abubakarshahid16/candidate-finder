import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizePublicUrl, providerRegistry } from '../infra/local-service/providers.mjs'
import { validateFilters } from '../infra/local-service/search.mjs'

test('provider registry declares a free public URL provider', () => { const [provider] = providerRegistry(); assert.equal(provider.requiresApiKey, false); assert.equal(provider.supportsPublicProfileUrls, true); assert.ok(provider.prohibitedFields.includes('age')) })
test('public URL normalization blocks unsafe and unsupported URLs', async () => { assert.equal(await normalizePublicUrl('https://example.com/profile#section'), 'https://example.com/profile'); await assert.rejects(() => normalizePublicUrl('http://127.0.0.1/admin'), /blocked_private_host/); await assert.rejects(() => normalizePublicUrl('ftp://example.com/file'), /unsupported_url/) })
test('filter validation remains independent of provider availability', () => { assert.deepEqual(validateFilters({ role: 'data_engineer' }), []) })
