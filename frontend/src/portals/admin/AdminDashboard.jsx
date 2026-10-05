import { useEffect, useState } from 'react'
import { getAdminDashboard } from '../../api/admin.js'
import { useAuth } from '../../auth/authContext.js'
import DashboardTile from '../../components/ui/DashboardTile.jsx'
import PageHeading from '../../components/ui/PageHeading.jsx'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [counts, setCounts] = useState(null)

  useEffect(() => {
    getAdminDashboard()
      .then(setCounts)
      .catch(() => setCounts(null))
  }, [])

  return (
    <>
      <PageHeading title="Admin dashboard">Welcome, {user.name}</PageHeading>
      <p className="mt-4 max-w-prose">Keep OpenDoor trustworthy and its shared lists up to date.</p>
      <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardTile
          title="Employer verification"
          count={counts?.companies_waiting_for_verification ?? '–'}
          to="/admin/employers"
          linkLabel="Review companies"
        >
          Companies waiting for their registration number to be checked.
        </DashboardTile>
        <DashboardTile title="Posting approvals" comingSoon>
          Approve job postings before they go live.
        </DashboardTile>
        <DashboardTile title="Categories" count={counts?.categories ?? '–'} to="/admin/categories" linkLabel="Manage categories">
          Job categories used for browsing and filtering.
        </DashboardTile>
        <DashboardTile
          title="Accommodation types"
          count={counts?.active_accommodations ?? '–'}
          to="/admin/accommodations"
          linkLabel="Manage accommodation types"
        >
          Active accommodation types used in profiles, postings and filters.
        </DashboardTile>
        <DashboardTile
          title="HR officers per department"
          count={counts?.hr_per_department_cap ?? '–'}
          to="/admin/settings"
          linkLabel="Change in settings"
        >
          The most HR officers any company department can have.
        </DashboardTile>
      </ul>
    </>
  )
}
