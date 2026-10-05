import { Link } from 'react-router-dom'

/**
 * Filter links (e.g., Waiting · Verified · Rejected). The active one is marked with
 * aria-current="true" ("current item"; the menu link already marks the current page).
 */
export default function FilterTabs({ label, items, current, param = 'status' }) {
  return (
    <nav aria-label={label}>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => {
          const active = item.value === current
          return (
            <li key={item.value}>
              <Link
                to={`?${param}=${item.value}`}
                aria-current={active ? 'true' : undefined}
                className={`inline-flex min-h-11 items-center rounded-full border-2 px-4 font-bold ${active ? 'border-primary bg-primary text-on-primary' : 'border-muted bg-surface text-text hover:border-primary'}`}
              >
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
