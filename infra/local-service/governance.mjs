export function sameOrganization(user, organizationId) {
  return Boolean(user?.organizationId && organizationId && user.organizationId === organizationId)
}

export function deletionPlan({ organizationId, candidateId }) {
  return { organizationId, candidateId, keys: [`review:${organizationId}:${candidateId}`], auditEvent: 'candidate.data_deleted', reversible: false }
}
