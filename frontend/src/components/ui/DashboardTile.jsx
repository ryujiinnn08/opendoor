import { Link } from 'react-router-dom'
import { TEXT_LINK } from './buttonLinkStyles.js'

/**
 * Summary tile on dashboards. With `to`, the whole title is a link; `comingSoon` marks
 * features from later phases.
 */
export default function DashboardTile({ title, children, to, linkLabel, count, comingSoon = false }) {
  return (
    <li className="flex flex-col rounded-lg border border-border bg-surface p-5">
      <h2 className="text-xl font-bold">{title}</h2>
      {count !== undefined && <p className="mt-3 text-title leading-none font-bold">{count}</p>}
      <div className="mt-2 flex-1">{children}</div>
      {to && (
        <Link to={to} className={`mt-3 self-start ${TEXT_LINK}`}>
          {linkLabel ?? `Go to ${title.toLowerCase()}`}
        </Link>
      )}
      {comingSoon && <p className="mt-4 text-sm font-bold text-muted">Coming in a later update</p>}
    </li>
  )
}
