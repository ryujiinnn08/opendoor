const TONES = {
  success: { classes: 'border-success', icon: '✓' },
  info: { classes: 'border-primary', icon: 'ℹ' },
  error: { classes: 'border-danger', icon: '!' },
}

/**
 * A visible message box. It is not a live region: pair it with useAnnounce() so screen
 * readers hear the message too.
 */
export default function Notice({ tone = 'info', children, className = '' }) {
  const { classes, icon } = TONES[tone]

  return (
    <div className={`flex gap-3 rounded-md border-l-8 bg-surface p-4 ${classes} ${className}`}>
      <span aria-hidden="true" className="font-bold">
        {icon}
      </span>
      <div className="max-w-prose">{children}</div>
    </div>
  )
}
