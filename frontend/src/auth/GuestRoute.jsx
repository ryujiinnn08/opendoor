import { Navigate, Outlet, useSearchParams } from 'react-router-dom'
import LoadingMessage from '../components/ui/LoadingMessage.jsx'
import { useAuth } from './authContext.js'
import { dashboardFor, safeNext } from './redirects.js'

/**
 * Login and registration pages: logged-in users are sent to the page they asked for
 * (?next=, internal paths only) or to their dashboard. This also runs the moment a login
 * succeeds, so it must honor ?next= itself.
 */
export default function GuestRoute() {
  const { status, role } = useAuth()
  const [searchParams] = useSearchParams()

  if (status === 'loading') return <LoadingMessage />
  if (status === 'authenticated') {
    return <Navigate to={safeNext(searchParams.get('next')) ?? dashboardFor(role)} replace />
  }

  return <Outlet />
}
