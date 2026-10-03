import { useEffect, useRef } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/candidate/dashboard', label: 'Candidate' },
  { to: '/employer/dashboard', label: 'Employer' },
  { to: '/admin/dashboard', label: 'Admin' },
]

export default function AppLayout() {
  const { pathname } = useLocation()
  const isFirstRender = useRef(true)

  // Move focus to the new page's heading so screen-reader users hear the page change.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    document.querySelector('main h1')?.focus()
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
      >
        Skip to main content
      </a>

      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="text-xl font-bold text-primary">
            OpenDoor
          </Link>
          <nav aria-label="Main">
            <ul className="flex flex-wrap gap-1">
              {navLinks.map((link) => (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    end
                    className={({ isActive }) =>
                      `block rounded px-3 py-2 underline-offset-4 hover:underline ${isActive ? 'font-bold underline' : ''}`
                    }
                  >
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-4 text-sm text-muted">
          OpenDoor: jobs matched to your accommodation needs.
        </div>
      </footer>
    </div>
  )
}
