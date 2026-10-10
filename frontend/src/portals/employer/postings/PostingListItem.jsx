import { Link } from 'react-router-dom'
import PostingStatusBadge from '../../../components/postings/PostingStatusBadge.jsx'
import Button from '../../../components/ui/Button.jsx'
import { SECONDARY_LINK } from '../../../components/ui/buttonLinkStyles.js'
import { formatDay } from '../../../lib/format.js'

const BUTTONS = [
  { action: 'change_closing_date', label: 'Change closing date' },
  { action: 'close', label: 'Close' },
  { action: 'reopen', label: 'Reopen' },
  { action: 'delete', label: 'Delete' },
]

/**
 * One posting in the Job postings list, as a ruled row (plan PHASE_2 §4.10). The buttons are
 * the posting's `actions`, which the server decides (decision 34). The title opens the preview.
 */
export default function PostingListItem({ posting, showDepartment, showCreator, onAction }) {
  const count = posting.accommodations.length

  return (
    <li id={`posting-${posting.id}`} className="border-b border-border py-6 first:border-t">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
        <h3 className="text-xl font-bold">
          <Link to={`/employer/job-postings/${posting.id}`} className="inline-flex min-h-11 items-center text-primary underline underline-offset-4 hover:no-underline">
            {posting.title}
          </Link>
        </h3>
        <PostingStatusBadge status={posting.status} />
      </div>

      <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-muted">
        {showDepartment && posting.department && <li>Department: {posting.department.name}</li>}
        <li>{posting.closes_on ? `Closing date: ${formatDay(posting.closes_on)}` : 'No closing date yet'}</li>
        <li>{count === 1 ? '1 accommodation' : `${count} accommodations`}</li>
        {showCreator && posting.created_by && <li>Created by {posting.created_by.name}</li>}
      </ul>

      {posting.status === 'rejected' && posting.rejection_reason && (
        <p className="mt-3 max-w-prose">
          <span className="font-bold">Reason it was rejected:</span> {posting.rejection_reason}
        </p>
      )}
      {posting.closed_automatically && (
        <p className="mt-3">The closing date passed on {formatDay(posting.closes_on)}. Reopen it to choose a new one.</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {posting.actions.includes('edit') && (
          <Link to={`/employer/job-postings/${posting.id}/edit`} aria-label={`Edit ${posting.title}`} className={SECONDARY_LINK}>
            Edit
          </Link>
        )}
        {BUTTONS.filter(({ action }) => posting.actions.includes(action)).map(({ action, label }) => (
          <Button
            key={action}
            variant="secondary"
            aria-label={`${label} ${posting.title}`}
            onClick={() => onAction(action, posting)}
          >
            {label}
          </Button>
        ))}
      </div>
    </li>
  )
}
