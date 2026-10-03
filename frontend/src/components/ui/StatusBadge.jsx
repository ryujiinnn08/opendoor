const TONES = {
  success: { classes: 'border-success text-success', icon: '✓' },
  neutral: { classes: 'border-muted text-muted', icon: '⊘' },
  danger: { classes: 'border-danger text-danger', icon: '✕' },
  info: { classes: 'border-primary text-primary', icon: '●' },
}

/**
 * Status shown with an icon and text, never color alone (WCAG 1.4.1).
 */
export default function StatusBadge({ tone = 'info', children }) {
  const { classes, icon } = TONES[tone]

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border-2 bg-surface px-3 py-0.5 text-sm font-bold ${classes}`}>
      <span aria-hidden="true">{icon}</span>
      {children}
    </span>
  )
}
