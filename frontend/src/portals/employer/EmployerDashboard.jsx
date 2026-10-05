import { useEffect, useState } from 'react'
import { getDepartments } from '../../api/employer.js'
import { useAuth } from '../../auth/authContext.js'
import { employerKind } from '../../auth/employerAccess.js'
import DashboardTile from '../../components/ui/DashboardTile.jsx'
import PageHeading from '../../components/ui/PageHeading.jsx'
import VerificationBadge from '../../components/ui/VerificationBadge.jsx'

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
      <PageHeading title="Employer dashboard">Welcome, {user.name}</PageHeading>
      {kind === 'owner' && <OwnerDashboard employer={employer} />}
      {kind === 'hr' && (
        <>
          <p className="mt-4 max-w-prose">
            You're an HR officer in <span className="font-bold">{department.name}</span> at{' '}
            <span className="font-bold">{employer.name}</span>. You'll manage this department's job postings here.
          </p>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            <DashboardTile title={employer.name}>
              <span className="mt-1 block">
                <VerificationBadge status={employer.verification_status} />
              </span>
            </DashboardTile>
            <DashboardTile title="Job postings" comingSoon>
              Create and manage {department.name}'s job postings.
            </DashboardTile>
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
            <DashboardTile title="Job postings" comingSoon>
              Post jobs and list the accommodations you provide.
            </DashboardTile>
          </ul>
        </>
      )}
    </>
  )
}

function OwnerDashboard({ employer }) {
  const [team, setTeam] = useState(null)

  useEffect(() => {
    getDepartments()
      .then(setTeam)
      .catch(() => setTeam(null))
  }, [])

  const hrCount = team?.departments.reduce((sum, department) => sum + department.hr_officers.length, 0)

  return (
    <>
      <p className="mt-4 max-w-prose">
        You're the owner of <span className="font-bold">{employer.name}</span>.
      </p>
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        <DashboardTile title="Company profile" to="/employer/company" linkLabel="Go to company profile">
          <span className="mb-2 block">
            <VerificationBadge status={employer.verification_status} />
          </span>
          {VERIFICATION_TEXT[employer.verification_status]}
        </DashboardTile>
        <DashboardTile title="Team" to="/employer/team" linkLabel="Manage your team">
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
            'Departments and HR officers.'
          )}
        </DashboardTile>
        <DashboardTile title="Job postings" comingSoon>
          Post jobs and list the accommodations your workplace provides.
        </DashboardTile>
      </ul>
    </>
  )
}
