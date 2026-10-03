import { useEffect, useState } from 'react'
import { getAdminAccommodations, getCategories } from '../../api/masterData.js'
import { useAuth } from '../../auth/authContext.js'
import DashboardTile from '../../components/ui/DashboardTile.jsx'
import PageHeading from '../../components/ui/PageHeading.jsx'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [counts, setCounts] = useState(null)

  useEffect(() => {
    Promise.all([getCategories(), getAdminAccommodations()])
      .then(([categories, accommodations]) =>
        setCounts({
          categories: categories.length,
          accommodations: accommodations.filter((item) => item.is_active).length,
        }),
      )
      .catch(() => setCounts(null))
  }, [])

  return (
    <>
      <PageHeading title="Admin dashboard">Welcome, {user.name}</PageHeading>
      <p className="mt-4 max-w-prose">Manage the lists used across OpenDoor. More admin tools are on the way.</p>
      <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardTile title="Categories" count={counts?.categories ?? '–'} to="/admin/categories" linkLabel="Manage categories">
          Job categories used for browsing and filtering.
        </DashboardTile>
        <DashboardTile
          title="Accommodation types"
          count={counts?.accommodations ?? '–'}
          to="/admin/accommodations"
          linkLabel="Manage accommodation types"
        >
          Active accommodation types used in profiles, postings and filters.
        </DashboardTile>
        <DashboardTile title="Employer verification" comingSoon>
          Review companies waiting for the Verified badge.
        </DashboardTile>
        <DashboardTile title="Posting approvals" comingSoon>
          Approve job postings before they go live.
        </DashboardTile>
      </ul>
    </>
  )
}
