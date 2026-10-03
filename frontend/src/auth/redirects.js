const DASHBOARDS = {
  candidate: '/candidate/dashboard',
  employer: '/employer/dashboard',
  admin: '/admin/dashboard',
}

export function dashboardFor(role) {
  return DASHBOARDS[role] ?? '/'
}

/**
 * Returns `next` only when it is a path inside OpenDoor, so a crafted link like
 * /login?next=https://evil.example cannot send users to another site after login.
 */
export function safeNext(next) {
  if (typeof next !== 'string') return null
  if (!next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return null
  return next
}
