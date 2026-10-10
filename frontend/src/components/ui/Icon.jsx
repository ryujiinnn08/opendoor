// Simple 24×24 stroke icons. Each is decorative: the text next to it carries the meaning.
const PATHS = {
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  cross: ['M6 6l12 12', 'M18 6L6 18'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
  slash: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M6 18L18 6'],
  pencil: ['M4 20h4L19 9l-4-4L4 16v4z', 'M13.5 6.5l4 4'],
  lock: ['M6 11h12v9H6z', 'M8.5 11V8a3.5 3.5 0 0 1 7 0v3'],
  dot: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'],
  refresh: ['M20 11a8 8 0 0 0-14.6-4.5', 'M4 4v4h4', 'M4 13a8 8 0 0 0 14.6 4.5', 'M20 20v-4h-4'],
  door: ['M6 21V4h9v17', 'M3 21h18', 'M15 4l4 2v15', 'M12 12.5v.5'],
  chat: ['M4 5h16v11H9l-5 4V5z', 'M8 9.5h8', 'M8 12.5h5'],
  calendar: ['M4 6h16v14H4z', 'M4 10h16', 'M8 3v4', 'M16 3v4'],
  monitor: ['M3 5h18v11H3z', 'M8 20h8', 'M12 16v4'],
  people: ['M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M3 20a6 6 0 0 1 12 0', 'M16 5.5a3 3 0 0 1 0 5.5', 'M18 14.5a6 6 0 0 1 3 5.5'],
}

export default function Icon({ name, className = 'size-4' }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      {(PATHS[name] ?? PATHS.dot).map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  )
}
