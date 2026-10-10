import StatusBadge from '../ui/StatusBadge.jsx'

const STATUSES = {
  draft: { tone: 'neutral', icon: 'pencil', label: 'Draft' },
  pending: { tone: 'info', icon: 'clock', label: 'Waiting for approval' },
  open: { tone: 'success', icon: 'check', label: 'Open' },
  rejected: { tone: 'danger', icon: 'cross', label: 'Rejected' },
  closed: { tone: 'neutral', icon: 'lock', label: 'Closed' },
}

/** A posting's status as an icon and text, never color alone. */
export default function PostingStatusBadge({ status }) {
  const { tone, icon, label } = STATUSES[status] ?? STATUSES.draft

  return (
    <StatusBadge tone={tone} icon={icon}>
      {label}
    </StatusBadge>
  )
}
