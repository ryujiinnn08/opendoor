import { Link } from 'react-router-dom'

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-muted">
        <p>OpenDoor: jobs matched to your accommodation needs.</p>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-4">
            <li>
              <Link to="/privacy" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:no-underline">
                Privacy notice
              </Link>
            </li>
            <li>
              <Link to="/accessibility" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:no-underline">
                Accessibility
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}
