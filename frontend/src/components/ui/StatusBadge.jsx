import Icon from './Icon.jsx'

// Tinted, borderless pills, so a status never looks like a (bordered) button.
const TONES = {
  success: { classes: 'bg-success-soft text-success', icon: 'check' },
  neutral: { classes: 'bg-neutral-soft text-muted', icon: 'slash' },
  danger: { classes: 'bg-danger-soft text-danger', icon: 'cross' },
  info: { classes: 'bg-primary-soft text-primary', icon: 'clock' },
}

/**
 * Status shown with an icon and text, never color alone (WCAG 1.4.1). `icon` overrides the
 * tone's icon, e.g., a pencil for drafts.
 */
export default function StatusBadge({ tone = 'info', icon, children }) {
  const { classes, icon: toneIcon } = TONES[tone]

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${classes}`}>
      <Icon name={icon ?? toneIcon} className="size-4" />
      {children}
    </span>
  )
}
