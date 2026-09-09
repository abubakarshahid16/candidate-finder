const classifications = new Set(['saudi_arabia', 'outside_saudi_arabia', 'remote', 'unknown'])

export function classifyLocation(profile = {}) {
  if (profile.remote === 'explicitly_available' || profile.remote === true) return 'remote'
  if (classifications.has(profile.locationClassification)) return profile.locationClassification
  return 'unknown'
}

export function normalizeCandidateProfile(profile = {}, source) {
  const locationClassification = classifyLocation(profile)
  const evidence = Array.isArray(profile.evidence) ? profile.evidence : []
  const sourceUrl = source?.sourceUrl || source?.url || null
  const retrievedAt = source?.retrievedAt || new Date().toISOString()
  const claims = [
    ['headline', profile.headline],
    ['role', profile.role],
    ['location_classification', locationClassification],
    ['skills', Array.isArray(profile.skills) ? profile.skills.join(', ') : null],
    ['relocation_statement', profile.willingToRelocate || 'unknown'],
  ]
  const claimEvidence = claims.filter(([, value]) => value && value !== 'unknown').map(([field, value]) => ({ field, claim: String(value), sourceUrl, retrievedAt, confidence: field === 'location_classification' ? 0.8 : 0.6 }))
  return {
    displayName: profile.name || profile.headline || 'Unnamed candidate',
    headline: profile.headline || null,
    currentRole: profile.role || 'unknown',
    currentLocation: profile.preferredLocation || 'unknown',
    locationClassification,
    relocationStatement: profile.willingToRelocate || 'unknown',
    remoteStatement: profile.remote || 'unknown',
    skills: Array.isArray(profile.skills) ? profile.skills : [],
    evidence: [...evidence, ...claimEvidence].map(item => ({ ...item, sourceUrl: item.sourceUrl || sourceUrl, retrievedAt: item.retrievedAt || retrievedAt })),
    sourceUrl,
    retrievedAt,
  }
}

export function findPotentialDuplicates(candidates = []) {
  const groups = new Map()
  for (const candidate of candidates) {
    const key = `${String(candidate.displayName || '').toLowerCase().replace(/[^a-z0-9]/g, '')}|${String(candidate.currentRole || '').toLowerCase()}`
    if (!key.startsWith('|')) groups.set(key, [...(groups.get(key) || []), candidate])
  }
  return [...groups.values()].filter(group => group.length > 1).map(group => ({ candidateIds: group.map(candidate => candidate.id).filter(Boolean), reason: 'same_normalized_name_and_role', reversible: true, reviewStatus: 'needs_review' }))
}
