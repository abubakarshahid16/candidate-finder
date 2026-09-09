const prohibitedFields = new Set(['age', 'date_of_birth', 'gender', 'nationality', 'religion', 'health', 'race'])

export function scoreCandidate(candidate, requirementProfile = {}) {
  const requirements = Array.isArray(requirementProfile.requirements) ? requirementProfile.requirements : []
  const protectedInput = Object.keys(requirementProfile).some(key => prohibitedFields.has(key)) || requirements.some(item => prohibitedFields.has(item.type) || prohibitedFields.has(item.field))
  if (protectedInput) throw new Error('protected_field_not_allowed')
  const requiredSkills = requirements.filter(item => item.type === 'skill' && item.required !== false).map(item => item.value)
  const candidateSkills = new Set((candidate.skills || []).map(skill => String(skill).toLowerCase()))
  const matchedSkills = requiredSkills.filter(skill => candidateSkills.has(String(skill).toLowerCase()))
  const skillScore = requiredSkills.length ? matchedSkills.length / requiredSkills.length : 1
  const experienceRequired = Number.isFinite(requirementProfile.minimumExperienceYears) ? requirementProfile.minimumExperienceYears : null
  const experienceScore = experienceRequired === null ? 1 : candidate.experienceYears !== null && candidate.experienceYears >= experienceRequired ? 1 : 0
  const score = Math.round((skillScore * 0.7 + experienceScore * 0.3) * 100)
  return { score, confidence: requirements.length ? (matchedSkills.length === requiredSkills.length ? 'high' : 'medium') : 'low', matchedSkills, missingSkills: requiredSkills.filter(skill => !matchedSkills.includes(skill)), explanation: `Matched ${matchedSkills.length} of ${requiredSkills.length} required skills${experienceRequired === null ? '' : ` and experience requirement ${experienceRequired}+ years`}`, rubricVersion: 'deterministic-1' }
}
