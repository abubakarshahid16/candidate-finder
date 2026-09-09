import { createHash } from 'node:crypto'
import { lookup } from 'node:dns/promises'
import { redisCommand } from './redis.mjs'
import { createCircuitBreaker, withRetry } from './resilience.mjs'

const providerBreaker = createCircuitBreaker()

export const providers = [{ name: 'user_public_url', type: 'user_supplied_public_url', requiresApiKey: false, apiKeyOptional: false, enabled: true, supportedFields: ['title', 'headline', 'skills', 'location', 'experience'], prohibitedFields: ['age', 'date_of_birth', 'nationality', 'gender', 'religion', 'health'], countries: ['global'], rateLimit: '10 requests/minute', termsUrl: 'https://www.rfc-editor.org/rfc/rfc9110', commercialUse: 'review_required', supportsPublicProfileUrls: true }]
export function providerRegistry() { return providers }
export async function searchGithubProfiles(query) {
  const q = String(query || '').trim()
  if (!q) throw new Error('query_required')
  const response = await fetch(`https://api.github.com/search/users?q=${encodeURIComponent(q)}&per_page=20`, { headers: { accept: 'application/vnd.github+json', 'user-agent': 'candidate-finder-local' } })
  if (!response.ok) throw new Error(`github_http_${response.status}`)
  const body = await response.json()
  return (body.items || []).map(item => ({ id: `github:${item.id}`, name: item.login, title: 'Public GitHub profile', company: '', location: 'Unknown', locationType: 'Unknown', score: 0, confidence: 'Medium confidence', skills: [], sourceUrl: item.html_url, retrievedAt: new Date().toISOString(), evidence: `Public GitHub profile discovered for ${q}.`, provider: 'github_public_api' }))
}
export async function providerHealth() { try { await redisCommand(['PING']); return providers.map(provider => ({ ...provider, status: 'healthy' })) } catch { return providers.map(provider => ({ ...provider, status: 'degraded' })) } }

function privateIp(host) {
  return host === 'localhost' || host.endsWith('.local') || host === '::1' || /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)
}
export async function normalizePublicUrl(input) {
  let url
  try { url = new URL(input) } catch { throw new Error('invalid_url') }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('unsupported_url')
  if (privateIp(url.hostname)) throw new Error('blocked_private_host')
  const address = await lookup(url.hostname).catch(() => null)
  if (address && privateIp(address.address)) throw new Error('blocked_private_host')
  url.hash = ''
  return url.toString()
}
export async function ingestPublicUrl(input) {
  if (!providerBreaker.canRequest()) throw new Error('provider_circuit_open')
  const url = await normalizePublicUrl(input)
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 5000)
  try {
    const response = await withRetry(() => fetch(url, { signal: controller.signal, redirect: 'manual', headers: { accept: 'text/html,application/xhtml+xml' } }), { attempts: 2 })
    providerBreaker.recordSuccess()
    if (response.status >= 300 && response.status < 400) throw new Error('redirect_not_allowed')
    const type = response.headers.get('content-type') || ''
    if (!type.includes('text/html') && !type.includes('application/xhtml+xml')) throw new Error('unsupported_content_type')
    const text = await response.text(); if (Buffer.byteLength(text) > 1_000_000) throw new Error('response_too_large')
    const contentHash = createHash('sha256').update(text).digest('hex')
    const title = text.match(/<title[^>]*>([^<]+)</i)?.[1]?.trim() || null
    const description = text.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)?.[1] || null
    const jsonLd = [...text.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].flatMap(match => { try { return [JSON.parse(match[1])] } catch { return [] } })
    const visible = text.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/gi, ' ').replace(/\s+/g, ' ').trim()
    const skills = ['python', 'sql', 'spark', 'airflow', 'kubernetes', 'aws', 'azure', 'react'].filter(skill => new RegExp(`\\b${skill}\\b`, 'i').test(visible))
    const role = /data engineer/i.test(`${title} ${description} ${visible}`) ? 'data_engineer' : /software engineer|developer/i.test(`${title} ${description} ${visible}`) ? 'software_engineer' : 'unknown'
    const location = /riyadh|saudi arabia|ksa/i.test(visible) ? 'saudi_arabia' : 'unknown'
    return { sourceUrl: url, sourceType: 'user_supplied_public_url', retrievedAt: new Date().toISOString(), contentHash, extractionMethod: jsonLd.length ? 'json_ld' : title || description ? 'metadata' : 'rule_based', confidence: title ? 0.62 : 0.35, evidence: [{ field: 'headline', claim: title || 'Unknown', excerpt: (title || description || visible).slice(0, 240), sourceUrl: url }], profile: { headline: title, description, role, skills, locationClassification: location, preferredLocation: 'unknown', remote: 'unknown', willingToRelocate: 'unknown' } }
  } catch (error) { providerBreaker.recordFailure(); throw error
  } finally { clearTimeout(timer) }
}
