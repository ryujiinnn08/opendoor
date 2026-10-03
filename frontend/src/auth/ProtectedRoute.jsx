import { Navigate, Outlet, useLocation } from 'react-router-dom'
import LoadingMessage from '../components/ui/LoadingMessage.jsx'
import { useAuth } from './authContext.js'
import { dashboardFor } from './redirects.js'

/**
 * Shows child routes only to logged-in users with one of `roles`.
 * The server enforces the same rules; this only keeps navigation sensible.
 */
export default function ProtectedRoute({ roles }) {
  const { status, role } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <LoadingMessage />

  if (status === 'guest') {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  if (!roles.includes(role)) return <Navigate to={dashboardFor(role)} replace />

  return <Outlet />
}
