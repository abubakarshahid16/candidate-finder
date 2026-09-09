const candidates = [
  { id: '00000000-0000-0000-0000-000000000101', name: 'Synthetic Candidate A', role: 'data_engineer', industry: 'technology', skills: ['python', 'spark', 'airflow'], education: 'bachelors', experienceYears: 8, geography: 'saudi_arabia', relocation: false, remote: false, evidenceCount: 2 },
  { id: '00000000-0000-0000-0000-000000000102', name: 'Synthetic Candidate B', role: 'data_engineer', industry: 'technology', skills: ['python', 'spark'], education: 'masters', experienceYears: 7.5, geography: 'outside_saudi_arabia', relocation: true, remote: false, evidenceCount: 1 },
  { id: '00000000-0000-0000-0000-000000000103', name: 'Synthetic Candidate C', role: 'data_engineer', industry: 'technology', skills: ['python', 'sql'], education: 'bachelors', experienceYears: 6, geography: 'remote', relocation: false, remote: true, evidenceCount: 1 },
  { id: '00000000-0000-0000-0000-000000000104', name: 'Synthetic Candidate D', role: 'unknown', industry: 'unknown', skills: [], education: 'unknown', experienceYears: null, geography: 'unknown', relocation: false, remote: false, evidenceCount: 1 },
]

const allowed = {
  role: new Set(['software_engineer', 'data_engineer', 'data_scientist', 'security_engineer', 'product_manager', 'unknown']),
  industry: new Set(['technology', 'financial_services', 'telecommunications', 'energy', 'healthcare', 'unknown']),
  education: new Set(['secondary', 'associate', 'bachelors', 'masters', 'doctorate', 'professional_certification', 'unknown']),
  geography: new Set(['saudi_arabia', 'outside_saudi_arabia', 'remote', 'willing_to_relocate', 'unknown']),
  skills: new Set(['python', 'sql', 'spark', 'airflow', 'kubernetes', 'aws', 'azure', 'gcp']),
}

function list(value) {
  if (value === undefined || value === null) return []
  return Array.isArray(value) ? value : [value]
}

export function validateFilters(filters = {}) {
  const errors = []
  for (const field of ['role', 'industry', 'education', 'geography']) {
    if (filters[field] && !allowed[field].has(filters[field])) errors.push(`${field} is not a supported taxonomy value`)
  }
  for (const skill of [...list(filters.mustHaveSkills), ...list(filters.excludeSkills)]) {
    if (!allowed.skills.has(skill)) errors.push(`skill is not a supported taxonomy value: ${skill}`)
  }
  if (filters.minExperience !== undefined && (!Number.isFinite(filters.minExperience) || filters.minExperience < 0)) errors.push('minExperience must be a non-negative number')
  if (filters.maxExperience !== undefined && (!Number.isFinite(filters.maxExperience) || filters.maxExperience < 0)) errors.push('maxExperience must be a non-negative number')
  if (filters.minExperience !== undefined && filters.maxExperience !== undefined && filters.minExperience > filters.maxExperience) errors.push('minExperience cannot exceed maxExperience')
  return errors
}

export function searchSyntheticCandidates(filters = {}, organizationId) {
  const mustHave = list(filters.mustHaveSkills)
  const exclude = list(filters.excludeSkills)
  return candidates.filter((candidate) => {
    if (candidate.organizationId && candidate.organizationId !== organizationId) return false
    if (filters.role && candidate.role !== filters.role) return false
    if (filters.industry && candidate.industry !== filters.industry) return false
    if (filters.education && candidate.education !== filters.education) return false
    if (filters.geography && candidate.geography !== filters.geography && !(filters.geography === 'willing_to_relocate' && candidate.relocation)) return false
    if (filters.remoteOnly && !candidate.remote) return false
    if (filters.relocationOnly && !candidate.relocation) return false
    if (filters.minExperience !== undefined && (candidate.experienceYears === null || candidate.experienceYears < filters.minExperience)) return false
    if (filters.maxExperience !== undefined && (candidate.experienceYears === null || candidate.experienceYears > filters.maxExperience)) return false
    if (!mustHave.every((skill) => candidate.skills.includes(skill))) return false
    if (exclude.some((skill) => candidate.skills.includes(skill))) return false
    return true
  }).map((candidate) => ({ ...candidate, organizationId }))
}
