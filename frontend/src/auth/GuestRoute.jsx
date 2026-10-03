import { Navigate, Outlet } from 'react-router-dom'
import LoadingMessage from '../components/ui/LoadingMessage.jsx'
import { useAuth } from './authContext.js'
import { dashboardFor } from './redirects.js'

/**
 * Login and registration pages: logged-in users are sent to their dashboard.
 */
export default function GuestRoute() {
  const { status, role } = useAuth()

  if (status === 'loading') return <LoadingMessage />
  if (status === 'authenticated') return <Navigate to={dashboardFor(role)} replace />

  return <Outlet />
}
