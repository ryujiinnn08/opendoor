import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/authContext.js'
import { dashboardFor } from '../../auth/redirects.js'
import SiteFooter from './SiteFooter.jsx'
import SkipLink from './SkipLink.jsx'

const buttonLink = 'inline-flex min-h-11 items-center rounded-md px-4 font-bold'

export default function PublicLayout() {
  const { status, role } = useAuth()

  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-2xl font-bold text-primary">
            OpenDoor
          </Link>
          <nav aria-label="Account">
            <ul className="flex flex-wrap gap-2">
              {status === 'authenticated' ? (
                <li>
                  <Link to={dashboardFor(role)} className={`${buttonLink} bg-primary text-on-primary hover:bg-primary-hover`}>
                    Go to my dashboard
                  </Link>
                </li>
              ) : (
                <>
                  <li>
                    <Link to="/login" className={`${buttonLink} text-primary underline underline-offset-4 hover:no-underline`}>
                      Log in
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className={`${buttonLink} bg-primary text-on-primary hover:bg-primary-hover`}>
                      Register
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 outline-none">
        <Outlet />
      </main>

      <SiteFooter />
    </div>
  )
}
