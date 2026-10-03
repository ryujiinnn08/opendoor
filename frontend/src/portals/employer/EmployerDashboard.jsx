import { useAuth } from '../../auth/authContext.js'
import DashboardTile from '../../components/ui/DashboardTile.jsx'
import PageHeading from '../../components/ui/PageHeading.jsx'

export default function EmployerDashboard() {
  const { user } = useAuth()

  return (
    <>
      <PageHeading title="Employer dashboard">Welcome, {user.name}</PageHeading>
      <p className="mt-4 max-w-prose">This is your employer dashboard. These features are on the way:</p>
      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        <DashboardTile title="Company profile" comingSoon>
          Describe your company and submit your DTI or SEC registration number for verification.
        </DashboardTile>
        <DashboardTile title="Job postings" comingSoon>
          Post jobs and list the accommodations your workplace provides.
        </DashboardTile>
        <DashboardTile title="Trust score" comingSoon>
          See how hired employees rate the accommodations you delivered.
        </DashboardTile>
      </ul>
    </>
  )
}
