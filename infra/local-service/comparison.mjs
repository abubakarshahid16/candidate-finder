export function compareCandidates(candidates = []) {
  return candidates.slice(0, 4).map(candidate => ({ id: candidate.id, name: candidate.name || candidate.displayName, role: candidate.role || candidate.currentRole || 'unknown', location: candidate.location || candidate.currentLocation || 'unknown', skills: candidate.skills || [], score: candidate.score ?? null, confidence: candidate.confidence || 'unknown', missingEvidence: candidate.missingEvidence || [], sourceUrl: candidate.sourceUrl || null, retrievedAt: candidate.retrievedAt || null }))
}
