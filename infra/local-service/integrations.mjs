export function buildWritebackPayload({ candidate, destination, confirmedBy }) {
  if (!candidate?.id || !destination || !confirmedBy) throw new Error('confirmed_writeback_required')
  if (!['ats', 'crm'].includes(destination)) throw new Error('unsupported_destination')
  return { destination, candidateId: candidate.id, status: candidate.status || 'shortlisted', score: candidate.score ?? null, evidence: candidate.evidence || [], sourceUrl: candidate.sourceUrl || null, retrievedAt: candidate.retrievedAt || null, confirmedBy, confirmedAt: new Date().toISOString(), mode: 'recruiter_confirmed_preview' }
}
