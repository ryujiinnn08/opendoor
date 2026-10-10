import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDepartments, getEmployerDashboard } from '../../api/employer.js'
import { useAuth } from '../../auth/authContext.js'
import { employerKind } from '../../auth/employerAccess.js'
import Button from '../../components/ui/Button.jsx'
import DashboardTile from '../../components/ui/DashboardTile.jsx'
import Notice from '../../components/ui/Notice.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import VerificationBadge from '../../components/ui/VerificationBadge.jsx'
import { PRIMARY_LINK } from '../../components/ui/buttonLinkStyles.js'

// Non-zero posting counts are listed in this order.
const COUNT_TEXT = {
  open: (count) => `${count} open`,
  pending: (count) => `${count} waiting for approval`,
  draft: (count) => (count === 1 ? '1 draft' : `${count} drafts`),
  rejected: (count) => `${count} rejected`,
  closed: (count) => `${count} closed`,
}

/** A failed load inside a tile, with a way to try again. */
function TileLoadError({ children, onRetry }) {
  return (
    <Notice tone="error">
      <p>{children}</p>
      <Button variant="link" onClick={onRetry}>
        Try again
      </Button>
    </Notice>
  )
}

/** The postings this person may see, counted by status (whole company for owners). */
function PostingsTile({ title }) {
  const [counts, setCounts] = useState(null)
  const [failed, setFailed] = useState(false)

  const load = useCallback(() => {
    getEmployerDashboard()
      .then((data) => {
        setCounts(data.postings)
        setFailed(false)
      })
      .catch(() => setFailed(true))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const lines = counts ? Object.keys(COUNT_TEXT).filter((status) => counts[status] > 0) : []

  return (
    <DashboardTile title={title} to="/employer/job-postings" linkLabel="Manage job postings">
      {failed && <TileLoadError onRetry={load}>We couldn't load your posting counts.</TileLoadError>}
      {!counts && !failed && 'Post jobs and list the accommodations you provide.'}
      {counts && lines.length === 0 && 'No job postings yet.'}
      {lines.length > 0 && (
        <ul className="space-y-1">
          {lines.map((status) => (
            <li key={status}>{COUNT_TEXT[status](counts[status])}</li>
          ))}
        </ul>
      )}
    </DashboardTile>
  )
}

const VERIFICATION_TEXT = {
  not_submitted: 'Submit your registration number to get the Verified badge.',
  pending: 'An OpenDoor admin is checking your registration number.',
  verified: 'Your company is verified.',
  rejected: 'Your registration number was not accepted. See the reason and submit it again.',
}

export default function EmployerDashboard() {
  const { user } = useAuth()
  const kind = employerKind(user)
  const { employer, department } = user.membership

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name}`}
        documentTitle="Employer dashboard"
        actions={
          <Link to="/employer/job-postings/new" className={PRIMARY_LINK}>
            Create a job posting
          </Link>
        }
      />
      {kind === 'owner' && <OwnerDashboard employer={employer} />}
      {kind === 'hr' && (
        <>
          <p className="mt-4 max-w-prose">
            At <span className="font-bold">{employer.name}</span>, you're an HR officer in{' '}
            <span className="font-bold">{department.name}</span> and manage its job postings.
          </p>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            <DashboardTile title={employer.name}>
              <span className="mt-1 block">
                <VerificationBadge status={employer.verification_status} />
              </span>
            </DashboardTile>
            <PostingsTile title={`${department.name} job postings`} />
          </ul>
        </>
      )}
      {kind === 'individual' && (
        <>
          <p className="mt-4 max-w-prose">You're hiring as an individual employer.</p>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            <DashboardTile title="My profile" to="/employer/profile" linkLabel="Edit my profile">
              What job seekers see about you on your postings.
            </DashboardTile>
            <PostingsTile title="Job postings" />
          </ul>
        </>
      )}
    </>
  )
}

function OwnerDashboard({ employer }) {
  const [team, setTeam] = useState(null)
  const [teamFailed, setTeamFailed] = useState(false)

  const loadTeam = useCallback(() => {
    getDepartments()
      .then((data) => {
        setTeam(data)
        setTeamFailed(false)
      })
      .catch(() => setTeamFailed(true))
  }, [])

  useEffect(() => {
    loadTeam()
  }, [loadTeam])

  const hrCount = team?.departments.reduce((sum, department) => sum + department.hr_officers.length, 0)

  return (
    <>
      <p className="mt-4 max-w-prose">
        <span className="font-bold">{employer.name}</span> is your company. You manage its profile, team and job
        postings.
      </p>
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        <DashboardTile title="Company profile" to="/employer/company" linkLabel="Go to company profile">
          <span className="mb-2 block">
            <VerificationBadge status={employer.verification_status} />
          </span>
          {VERIFICATION_TEXT[employer.verification_status]}
        </DashboardTile>
        <DashboardTile title="Team" to="/employer/team" linkLabel="Manage your team">
          {teamFailed && <TileLoadError onRetry={loadTeam}>We couldn't load your team.</TileLoadError>}
          {team ? (
            <>
              {team.departments.length} {team.departments.length === 1 ? 'department' : 'departments'}, {hrCount} HR{' '}
              {hrCount === 1 ? 'officer' : 'officers'}.
              <span className="mt-2 block">
                {team.departments.map((department) => (
                  <span key={department.id} className="block text-muted">
                    {department.name}: {department.places_used} of {department.effective_limit} places used
                  </span>
                ))}
              </span>
            </>
          ) : (
            !teamFailed && 'Departments and HR officers.'
          )}
        </DashboardTile>
        <PostingsTile title="Job postings" />
      </ul>
    </>
  )
}
