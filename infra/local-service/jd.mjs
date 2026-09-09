const allowedExtensions = new Set(['.txt', '.pdf', '.docx'])
const maxBytes = 2_000_000
const blockedSignatures = ['eicar-standard-antivirus-test-file', 'x5o!p%@ap[4\\pzx54(p^)7cc)7}$eicar-standard-antivirus-test-file!$h+H*']

export function scanJobDescription(content) {
  const normalized = String(content).toLowerCase()
  return blockedSignatures.some(signature => normalized.includes(signature)) ? { clean: false, engine: 'local-signature-scan', reason: 'malware_signature_detected' } : { clean: true, engine: 'local-signature-scan', reason: null }
}

export function validateJobDescription(filename, content, encoded = false) {
  const extension = filename.toLowerCase().slice(filename.lastIndexOf('.'))
  const errors = []
  if (!allowedExtensions.has(extension)) errors.push('unsupported_file_type')
  if (typeof content !== 'string' || !content.trim()) errors.push(encoded ? 'job_description_file_required' : 'job_description_text_required')
  if (typeof content === 'string' && (encoded ? Buffer.byteLength(content, 'base64') : Buffer.byteLength(content, 'utf8')) > maxBytes) errors.push('job_description_too_large')
  return errors
}

export function parseJobDescription(text) {
  const normalized = text.replace(/\s+/g, ' ').trim()
  const skills = ['python', 'sql', 'spark', 'airflow', 'kubernetes', 'aws', 'azure', 'gcp', 'dbt', 'snowflake']
    .filter(skill => new RegExp(`\\b${skill}\\b`, 'i').test(normalized))
  const years = normalized.match(/(?:at least|minimum of|,?\s)(\d+)\+?\s+years?/i)
  const role = /data engineer/i.test(normalized) ? 'data_engineer' : /software engineer|developer/i.test(normalized) ? 'software_engineer' : 'unknown'
  return {
    role,
    skills,
    minimumExperienceYears: years ? Number(years[1]) : null,
    requirements: skills.map(skill => ({ type: 'skill', value: skill, required: true })),
    parserVersion: 'rules-1',
    sourceTextHashBasis: normalized,
  }
}
