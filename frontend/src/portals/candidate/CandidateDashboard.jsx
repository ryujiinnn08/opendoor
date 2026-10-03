import { useAuth } from '../../auth/authContext.js'
import DashboardTile from '../../components/ui/DashboardTile.jsx'
import PageHeading from '../../components/ui/PageHeading.jsx'

export default function CandidateDashboard() {
  const { user } = useAuth()

  return (
    <>
      <PageHeading title="Candidate dashboard">Welcome, {user.name}</PageHeading>
      <p className="mt-4 max-w-prose">This is your job seeker dashboard. These features are on the way:</p>
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        <DashboardTile title="My profile" comingSoon>
          Add your skills and the accommodations you need, so OpenDoor can match you with jobs.
        </DashboardTile>
        <DashboardTile title="Jobs that match your needs" comingSoon>
          See openings ranked by how many of your accommodation needs they meet.
        </DashboardTile>
        <DashboardTile title="My applications" comingSoon>
          Follow the status of every job you apply for.
        </DashboardTile>
      </ul>
    </>
  )
}
