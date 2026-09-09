const statuses = new Set(['new', 'reviewing', 'shortlisted', 'rejected', 'hired'])

export function validateReviewUpdate(body = {}) {
  const errors = []
  if (body.status !== undefined && !statuses.has(body.status)) errors.push('unsupported_review_status')
  if (body.notes !== undefined && typeof body.notes !== 'string') errors.push('notes_must_be_text')
  if (body.tags !== undefined && (!Array.isArray(body.tags) || body.tags.some(tag => typeof tag !== 'string'))) errors.push('tags_must_be_string_array')
  if (!body.candidateId || typeof body.candidateId !== 'string') errors.push('candidate_id_required')
  return errors
}
