import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './authContext.js'
import { employerKind } from './employerAccess.js'

/**
 * Employer pages for some kinds of employer only, e.g., kinds={['owner']} for the Team page.
 * Employers without a profile are sent to the setup screen first. (The server enforces the
 * same rules; this only keeps navigation sensible.)
 */
export function RequireEmployerProfile({ kinds }) {
  const { user } = useAuth()
  const kind = employerKind(user)

  if (kind === 'none') return <Navigate to="/employer/setup" replace />
  if (!kinds.includes(kind)) return <Navigate to="/employer/dashboard" replace />

  return <Outlet />
}

/** The setup screen, only for employers who don't have a profile yet. */
export function RequireNoEmployerProfile() {
  const { user } = useAuth()

  if (employerKind(user) !== 'none') return <Navigate to="/employer/dashboard" replace />

  return <Outlet />
}
