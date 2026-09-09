export function exportCandidates(candidates = [], format = 'json') {
  const records = candidates.map(candidate => ({ id: candidate.id, name: candidate.name || candidate.displayName, role: candidate.role || candidate.currentRole, score: candidate.score ?? null, confidence: candidate.confidence ?? null, sourceUrl: candidate.sourceUrl || null, retrievedAt: candidate.retrievedAt || null, evidence: candidate.evidence || [] }))
  if (format === 'json') return { contentType: 'application/json', body: JSON.stringify(records, null, 2) }
  if (format !== 'csv') throw new Error('unsupported_export_format')
  const columns = ['id', 'name', 'role', 'score', 'confidence', 'sourceUrl', 'retrievedAt', 'evidence']
  const escape = value => `"${String(value ?? '').replaceAll('"', '""')}"`
  const rows = records.map(record => columns.map(column => escape(column === 'evidence' ? JSON.stringify(record[column]) : record[column])).join(','))
  return { contentType: 'text/csv', body: [columns.join(','), ...rows].join('\n') }
}
