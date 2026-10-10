import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { decidePosting, getPostingForReview } from '../../api/admin.js'
import { fieldErrorsFrom, generalErrorFrom } from '../../api/client.js'
import JobDetails from '../../components/postings/JobDetails.jsx'
import PostingStatusBadge from '../../components/postings/PostingStatusBadge.jsx'
import Button from '../../components/ui/Button.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import LoadingMessage from '../../components/ui/LoadingMessage.jsx'
import Notice from '../../components/ui/Notice.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import ReasonDialog from '../../components/ui/ReasonDialog.jsx'
import { TEXT_LINK } from '../../components/ui/buttonLinkStyles.js'
import { formatDate, formatDay } from '../../lib/format.js'
import { manilaToday } from '../../lib/postingOptions.js'

/**
 * One posting for the admin to approve or reject (plan PHASE_2 decision 33). Drafts can't be
 * opened here; the API answers 404 for them.
 */
export default function PostingReviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [posting, setPosting] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [deciding, setDeciding] = useState(null) // { decision, open, busy, error }

  useEffect(() => {
    getPostingForReview(id)
      .then(setPosting)
      .catch((error) =>
        setLoadError(
          error?.response?.status === 404 ? "This posting doesn't exist, was deleted, or is still a draft." : generalErrorFrom(error),
        ),
      )
  }, [id])

  async function decide(reason) {
    setDeciding((current) => ({ ...current, busy: true, error: null }))
    try {
      const decided = await decidePosting(posting.id, deciding.decision, reason, posting.updated_at)
      let message = `"${posting.title}" was rejected. The employer can see your reason.`
      if (deciding.decision === 'approve') {
        message =
          decided.status === 'closed'
            ? `"${posting.title}" is approved. It shows as Closed until the employer chooses a new closing date.`
            : `"${posting.title}" is approved and open to job seekers.`
      }
      navigate('/admin/job-postings', { state: { message } })
    } catch (error) {
      const fieldErrors = fieldErrorsFrom(error)
      setDeciding(
        (current) => current && { ...current, busy: false, error: Object.values(fieldErrors)[0] ?? generalErrorFrom(error) },
      )
    }
  }

  // The dialog stays open while the decision is sent, so a refusal is never lost.
  function closeDialog(open) {
    if (!open) setDeciding((current) => (current && !current.busy ? { ...current, open: false } : current))
  }

  if (loadError) {
    return (
      <>
        <PageHeader title="Review posting" />
        <Notice tone="error" className="mt-6">
          <p>{loadError}</p>
          <Link to="/admin/job-postings" className={TEXT_LINK}>
            Back to posting approvals
          </Link>
        </Notice>
      </>
    )
  }

  if (!posting) {
    return (
      <>
        <PageHeader title="Review posting" />
        <LoadingMessage>Loading the posting…</LoadingMessage>
      </>
    )
  }

  const waiting = posting.status === 'pending'
  const datePassed = Boolean(posting.closes_on) && posting.closes_on < manilaToday()

  return (
    <>
      <PageHeader
        title={posting.title}
        documentTitle={`Review: ${posting.title}`}
        intro="Job seekers see this posting once you approve it."
      />
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <PostingStatusBadge status={posting.status} />
        {posting.submitted_at && <span className="text-muted">Submitted {formatDate(posting.submitted_at)}</span>}
      </div>

      {posting.changed_after_approval && (
        <Notice className="mt-6">This posting was approved before and has since been changed. Read it all again before you decide.</Notice>
      )}
      {waiting && datePassed && (
        <Notice className="mt-6">
          The closing date has passed. If you approve it, it shows as Closed until the employer reopens it with a new date.
        </Notice>
      )}
      {posting.status === 'rejected' && posting.rejection_reason && (
        <Notice tone="error" className="mt-6">
          <span className="font-bold">You rejected this posting.</span> Reason: {posting.rejection_reason}
        </Notice>
      )}

      <JobDetails posting={posting} showVerificationStatus markRetired />

      {waiting && (
        <section aria-labelledby="decision-heading" className="mt-12 border-t border-border pt-8">
          <h2 id="decision-heading" className="text-2xl font-bold">
            Your decision
          </h2>
          <p className="mt-2 max-w-prose">
            Approve it if it describes a real job and lists accommodations the employer can provide. If something needs
            fixing, reject it and say what.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => setDeciding({ decision: 'approve', open: true })}>Approve</Button>
            <Button variant="secondary" onClick={() => setDeciding({ decision: 'reject', open: true })}>
              Reject
            </Button>
          </div>
        </section>
      )}

      <p className="mt-12">
        <Link to="/admin/job-postings" className={TEXT_LINK}>
          Back to posting approvals
        </Link>
      </p>

      <ConfirmDialog
        open={Boolean(deciding?.open && deciding.decision === 'approve')}
        onOpenChange={closeDialog}
        title={`Approve "${posting.title}"?`}
        description={
          posting.closes_on && !datePassed
            ? `Job seekers can see it until ${formatDay(posting.closes_on)}.`
            : 'It will show as Closed until the employer chooses a new closing date.'
        }
        confirmLabel="Approve posting"
        confirmVariant="primary"
        onConfirm={() => decide()}
        busy={deciding?.busy}
        error={deciding?.error}
      />
      <ReasonDialog
        open={Boolean(deciding?.open && deciding.decision === 'reject')}
        onOpenChange={closeDialog}
        title={`Reject "${posting.title}"?`}
        description="The employer will see your reason."
        hint="Say what to fix, e.g., the description doesn't say what the job involves."
        confirmLabel="Reject posting"
        onConfirm={decide}
        busy={deciding?.busy}
        error={deciding?.error}
      />
    </>
  )
}
