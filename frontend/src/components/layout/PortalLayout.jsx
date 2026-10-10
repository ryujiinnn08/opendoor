import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/authContext.js'
import { employerSummary } from '../../auth/employerAccess.js'
import { dashboardFor } from '../../auth/redirects.js'
import { useAnnounce } from '../ui/announcerContext.js'
import Button from '../ui/Button.jsx'
import { portalFor } from './portalMenus.js'
import BrandLink from './BrandLink.jsx'
import SiteFooter from './SiteFooter.jsx'
import SkipLink from './SkipLink.jsx'

/**
 * Shared frame for the candidate, employer and admin portals; the menu depends on the role.
 */
export default function PortalLayout() {
  const { user, role, logout } = useAuth()
  const navigate = useNavigate()
  const announce = useAnnounce()
  const [loggingOut, setLoggingOut] = useState(false)
  const portal = portalFor(user)
  const summary = employerSummary(user)

  async function handleLogout() {
    setLoggingOut(true)
    // Leave the portal first: clearing the user while still inside it would make the
    // route guard redirect to the login page instead of the home page.
    navigate('/', { replace: true, state: { loggedOut: true } })
    await logout()
    announce('You have logged out.')
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <BrandLink to={dashboardFor(role)} />
            <span className="font-bold text-muted">{portal.name}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p>
              <span className="sr-only">Logged in as</span> <span className="font-bold">{user.name}</span>
              {summary && <span className="block text-sm text-muted">{summary}</span>}
            </p>
            <Button variant="secondary" onClick={handleLogout} loading={loggingOut} loadingText="Logging out…">
              Log out
            </Button>
          </div>
        </div>
        <nav aria-label={portal.name} className="border-t border-border">
          <ul className="mx-auto flex max-w-6xl flex-wrap gap-1 px-4">
            {portal.menu.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end ?? true}
                  className={({ isActive }) =>
                    `block min-h-11 border-b-4 px-3 py-2 ${isActive ? 'border-primary font-bold text-primary' : 'border-transparent hover:underline'}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 outline-none">
        <Outlet />
      </main>

      <SiteFooter />
    </div>
  )
}
