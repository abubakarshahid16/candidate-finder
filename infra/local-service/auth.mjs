const users = [
  { id: '00000000-0000-0000-0000-000000000011', email: 'recruiter@example.test', name: 'Demo Recruiter', role: 'recruiter', organizationId: '00000000-0000-0000-0000-000000000001', token: 'dev-recruiter-token' },
  { id: '00000000-0000-0000-0000-000000000012', email: 'manager@example.test', name: 'Demo Hiring Manager', role: 'hiring_manager', organizationId: '00000000-0000-0000-0000-000000000001', token: 'dev-manager-token' },
  { id: '00000000-0000-0000-0000-000000000013', email: 'admin@example.test', name: 'Demo Admin', role: 'admin', organizationId: '00000000-0000-0000-0000-000000000001', token: 'dev-admin-token' },
]

const permissions = {
  recruiter: ['candidate:read', 'candidate:shortlist', 'search:run'],
  hiring_manager: ['candidate:read', 'shortlist:read', 'shortlist:comment'],
  admin: ['candidate:read', 'candidate:shortlist', 'search:run', 'shortlist:read', 'shortlist:comment', 'organization:manage', 'audit:read'],
}

export function findUserByEmail(email) {
  return users.find((user) => user.email === email)
}

export function authenticateToken(token) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_AUTH !== 'true') return null
  const user = users.find((candidate) => candidate.token === token)
  if (!user) return null
  return { ...user, permissions: permissions[user.role] }
}

export function authenticateApiKey(apiKey) {
  if (process.env.SERVICE_API_KEY && apiKey === process.env.SERVICE_API_KEY) return { id: 'service-account-local', email: 'service-account@local', name: 'Local service account', role: 'admin', organizationId: process.env.SERVICE_API_ORGANIZATION || '00000000-0000-0000-0000-000000000001', permissions: permissions.admin, serviceAccount: true }
  return null
}

export function login(email, password) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEV_AUTH !== 'true') return null
  const user = findUserByEmail(email)
  if (!user || password !== 'local-dev') return null
  return { token: user.token, user: { id: user.id, email: user.email, name: user.name, role: user.role, organizationId: user.organizationId, permissions: permissions[user.role] } }
}

export function listDevelopmentUsers() {
  return users.map(({ token: _token, ...user }) => ({ ...user, permissions: permissions[user.role] }))
}

export function hasPermission(user, permission) {
  return Boolean(user?.permissions?.includes(permission))
}

export function requireAuth(request) {
  const apiKeyUser = authenticateApiKey(request.headers['x-api-key'])
  if (apiKeyUser) return apiKeyUser
  const header = request.headers.authorization || ''
  if (!header.startsWith('Bearer ')) return null
  const user = authenticateToken(header.slice('Bearer '.length))
  if (!user) return null
  if (process.env.REQUIRE_MFA === 'true' && request.headers['x-mfa-verified'] !== 'true') return null
  return user
}
