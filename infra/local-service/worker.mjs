import { createServer } from 'node:http'
import { redisCommand } from './redis.mjs'
import { ingestPublicUrl } from './providers.mjs'
import { incrementMetric } from './observability.mjs'

const port = Number(process.env.WORKER_PORT || 3002)
const intervalMs = 30_000

console.log('Candidate Finder worker placeholder started; no jobs configured.')

async function processJobs() {
  try {
    const jobId = await redisCommand(['LPOP', 'search-jobs']); if (!jobId) return
    incrementMetric('worker.jobs_started')
    const raw = await redisCommand(['GET', `search-job:${jobId}`]); if (!raw) return
    const job = JSON.parse(raw); job.status = 'running'; job.progress = 10; job.currentStage = 'source_ingestion'; job.startedAt = new Date().toISOString(); await redisCommand(['SET', `search-job:${jobId}`, JSON.stringify(job)])
    const results = []; const coverage = []
    for (const url of job.publicProfileUrls) {
      try {
        const result = await ingestPublicUrl(url)
        results.push(result)
        coverage.push({ url, status: 'complete', resultCount: 1, retrievedAt: result.retrievedAt, contentHash: result.contentHash })
        await redisCommand(['RPUSH', 'source-records', JSON.stringify({ organizationId: job.organizationId, jobId, sourceUrl: result.sourceUrl, sourceType: result.sourceType, retrievedAt: result.retrievedAt, contentHash: result.contentHash, extractionMethod: result.extractionMethod, status: 'complete' })])
      } catch (error) {
        coverage.push({ url, status: 'blocked_or_unavailable', error: error.message, resultCount: 0 })
        await redisCommand(['RPUSH', 'source-records', JSON.stringify({ organizationId: job.organizationId, jobId, sourceUrl: url, status: 'blocked_or_unavailable', error: error.message, recordedAt: new Date().toISOString() })])
      }
    }
    job.status = 'completed'; job.progress = 100; job.currentStage = 'completed'; job.resultCount = results.length; job.results = results; job.sourceCoverage = coverage; job.extractionMethod = results.map(result => result.extractionMethod); job.completedAt = new Date().toISOString(); await redisCommand(['SET', `search-job:${jobId}`, JSON.stringify(job)]); await redisCommand(['RPUSH', 'audit-events', JSON.stringify({ eventType: 'search.completed', userId: job.userId, organizationId: job.organizationId, jobId, resultCount: job.resultCount, createdAt: job.completedAt })])
  } catch (error) { incrementMetric('worker.errors'); console.error(`search_worker_error:${error.message}`) }
}
setInterval(processJobs, 1000)

createServer((request, response) => {
  if (request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' })
    response.end(JSON.stringify({ status: 'ok', service: 'worker', mode: 'local-placeholder' }))
    return
  }
  response.writeHead(404)
  response.end()
}).listen(port, '0.0.0.0', () => {
  console.log(`Candidate Finder worker health endpoint listening on ${port}`)
})

setInterval(() => {
  console.log('Candidate Finder worker heartbeat')
}, intervalMs)
