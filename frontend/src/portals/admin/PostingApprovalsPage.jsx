import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { getPostingQueue } from '../../api/admin.js'
import { generalErrorFrom } from '../../api/client.js'
import PostingStatusBadge from '../../components/postings/PostingStatusBadge.jsx'
import Button from '../../components/ui/Button.jsx'
import FilterTabs from '../../components/ui/FilterTabs.jsx'
import LoadingMessage from '../../components/ui/LoadingMessage.jsx'
import Notice from '../../components/ui/Notice.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import VerificationBadge from '../../components/ui/VerificationBadge.jsx'
import { useAnnounce } from '../../components/ui/announcerContext.js'
import { formatDate } from '../../lib/format.js'

const TABS = [
  { value: 'pending', label: 'Waiting' },
  { value: 'open', label: 'Open' },
  { value: 'rejected', label: 'Rejected' },
]

const EMPTY = {
  pending: 'No postings are waiting for approval.',
  open: 'No open postings.',
  rejected: 'No rejected postings.',
}

/**
 * The admin's posting queue (plan PHASE_2 decision 33): Waiting (oldest first), Open, Rejected.
 */
export default function PostingApprovalsPage() {
  const announce = useAnnounce()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const status = TABS.some((tab) => tab.value === searchParams.get('status')) ? searchParams.get('status') : 'pending'

  // Kept with the tab it was loaded for, so a new tab shows "Loading…" until its own list arrives.
  const [list, setList] = useState(null) // { status, items }
  const postings = list?.status === status ? list.items : null
  const [loadError, setLoadError] = useState(null)
  const [attempt, setAttempt] = useState(0) // Try again loads the list once more
  // The result of a decision on the review page is shown once.
  const [message] = useState(() => location.state?.message ?? null)

  const flash = location.state?.message
  useEffect(() => {
    if (!flash) return
    announce(flash)
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null })
  }, [flash, announce, navigate, location.pathname, location.search])

  useEffect(() => {
    // An earlier tab's slower response is ignored.
    let current = true
    getPostingQueue(status)
      .then((items) => {
        if (!current) return
        setList({ status, items })
        setLoadError(null)
      })
      .catch((error) => {
        if (current) setLoadError(generalErrorFrom(error))
      })
    return () => {
      current = false
    }
  }, [status, attempt])

  const heading = TABS.find((tab) => tab.value === status).label

  return (
    <>
      <PageHeader
        title="Posting approvals"
        intro="Check each posting before job seekers can see it. Waiting postings are listed oldest first."
      />

      {message && (
        <Notice tone="success" className="mt-6">
          {message}
        </Notice>
      )}

      <div className="mt-8">
        <FilterTabs label="Posting status" items={TABS} current={status} />
      </div>

      <h2 className="mt-10 text-2xl font-bold">
        {heading}
        {postings ? ` (${postings.length})` : ''}
      </h2>

      {loadError && (
        <Notice tone="error" className="mt-4">
          <p>{loadError}</p>
          <Button variant="link" onClick={() => setAttempt((count) => count + 1)}>
            Try again
          </Button>
        </Notice>
      )}
      {!postings && !loadError && <LoadingMessage>Loading postings…</LoadingMessage>}
      {postings?.length === 0 && <p className="mt-4">{EMPTY[status]}</p>}

      {postings?.length > 0 && (
        <ul className="mt-4">
          {postings.map((posting) => (
            <li key={posting.id} className="border-b border-border py-6 first:border-t">
              <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                <h3 className="text-xl font-bold">
                  <Link
                    to={`/admin/job-postings/${posting.id}`}
                    className="inline-flex min-h-11 items-center text-primary underline underline-offset-4 hover:no-underline"
                  >
                    {posting.title}
                  </Link>
                </h3>
                <PostingStatusBadge status={posting.status} />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-bold">{posting.employer.name}</span>
                {posting.employer.type === 'company' ? (
                  <VerificationBadge status={posting.employer.verification_status} />
                ) : (
                  <span className="text-muted">Individual employer</span>
                )}
              </div>

              <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-muted">
                {posting.department && <li>Department: {posting.department.name}</li>}
                {posting.category && <li>Category: {posting.category.name}</li>}
                {posting.submitted_at && <li>Submitted {formatDate(posting.submitted_at)}</li>}
              </ul>

              {posting.changed_after_approval && (
                <p className="mt-3">
                  <StatusBadge tone="info" icon="refresh">
                    Changed after approval
                  </StatusBadge>
                </p>
              )}
              {status === 'rejected' && posting.rejection_reason && (
                <p className="mt-3 max-w-prose">
                  <span className="font-bold">Reason:</span> {posting.rejection_reason}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
