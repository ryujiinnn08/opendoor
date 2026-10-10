import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { generalErrorFrom } from '../../api/client.js'
import { getJobPosting } from '../../api/jobPostings.js'
import JobDetails from '../../components/postings/JobDetails.jsx'
import PostingStatusBadge from '../../components/postings/PostingStatusBadge.jsx'
import LoadingMessage from '../../components/ui/LoadingMessage.jsx'
import Notice from '../../components/ui/Notice.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import { PRIMARY_LINK, TEXT_LINK } from '../../components/ui/buttonLinkStyles.js'
import { formatDay } from '../../lib/format.js'

/**
 * The posting as job seekers will see it once it's open, for any status (plan PHASE_2 §4.6).
 */
export default function JobPostingPreviewPage() {
  const { id } = useParams()
  const [posting, setPosting] = useState(null)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    getJobPosting(id)
      .then(setPosting)
      .catch((error) =>
        setLoadError(error?.response?.status === 404 ? "This posting doesn't exist or was deleted." : generalErrorFrom(error)),
      )
  }, [id])

  if (loadError) {
    return (
      <>
        <PageHeader title="Job posting" />
        <Notice tone="error" className="mt-6">
          <p>{loadError}</p>
          <Link to="/employer/job-postings" className={TEXT_LINK}>
            Back to job postings
          </Link>
        </Notice>
      </>
    )
  }

  if (!posting) {
    return (
      <>
        <PageHeader title="Job posting" />
        <LoadingMessage>Loading the posting…</LoadingMessage>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={posting.title}
        documentTitle={`Preview: ${posting.title}`}
        intro="This is how job seekers will see your posting once it's open."
        actions={
          posting.actions?.includes('edit') && (
            <Link to={`/employer/job-postings/${posting.id}/edit`} className={PRIMARY_LINK}>
              Edit posting
            </Link>
          )
        }
      />
      <p className="mt-4">
        <PostingStatusBadge status={posting.status} />
      </p>

      {posting.status === 'rejected' && (
        <Notice tone="error" className="mt-6">
          <span className="font-bold">An OpenDoor admin rejected this posting.</span> Reason: {posting.rejection_reason}
        </Notice>
      )}
      {posting.closed_automatically && (
        <Notice className="mt-6">
          The closing date passed on {formatDay(posting.closes_on)}. Reopen it from the Job postings page to choose a new
          one.
        </Notice>
      )}

      <JobDetails posting={posting} />

      <p className="mt-12">
        <Link to="/employer/job-postings" className={TEXT_LINK}>
          Back to job postings
        </Link>
      </p>
    </>
  )
}
