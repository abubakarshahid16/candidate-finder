import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), 'document-extract.py')

export function extractDocumentText(filename, base64Content) {
  const result = spawnSync('python', [script, filename], { input: base64Content, encoding: 'utf8', maxBuffer: 3_000_000 })
  if (result.error || result.status !== 0) throw new Error('document_extraction_failed')
  try { return JSON.parse(result.stdout).text } catch { throw new Error('document_extraction_failed') }
}
