import StatusBadge from './StatusBadge.jsx'

/**
 * "2 of 3 places used". Places are HR officers plus unused invites (plan PHASE_2 decision 15).
 */
export default function PlacesCounter({ used, limit, effectiveLimit }) {
  const full = used >= effectiveLimit
  const percent = Math.min(100, Math.round((used / Math.max(effectiveLimit, 1)) * 100))

  return (
    <div>
      <p className="flex flex-wrap items-center gap-2">
        <span className="font-bold">
          {used} of {effectiveLimit} places used
        </span>
        {full && <StatusBadge tone="neutral">Full</StatusBadge>}
      </p>
      <div aria-hidden="true" className="mt-2 h-2 w-full max-w-xs overflow-hidden rounded-full bg-primary-soft">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
      </div>
      {effectiveLimit < limit && (
        <p className="mt-2 text-sm text-muted">
          This department's limit is {limit}, but OpenDoor currently allows at most {effectiveLimit} HR officers per
          department.
        </p>
      )}
    </div>
  )
}
