import StatusBadge from './StatusBadge.jsx'

const STATUSES = {
  not_submitted: { tone: 'neutral', label: 'Not verified' },
  pending: { tone: 'info', label: 'Verification: waiting for review' },
  verified: { tone: 'success', label: 'Verified company' },
  rejected: { tone: 'danger', label: 'Verification rejected' },
}

/** A company's verification status as text and icon, never color alone. */
export default function VerificationBadge({ status }) {
  const { tone, label } = STATUSES[status] ?? STATUSES.not_submitted
  return <StatusBadge tone={tone}>{label}</StatusBadge>
}
