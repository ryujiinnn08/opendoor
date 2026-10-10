import { useCallback, useEffect, useState } from 'react'
import { getAdminDashboard } from '../../api/admin.js'
import { useAuth } from '../../auth/authContext.js'
import Button from '../../components/ui/Button.jsx'
import DashboardTile from '../../components/ui/DashboardTile.jsx'
import Notice from '../../components/ui/Notice.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'

export default function AdminDashboard() {
  const { user } = useAuth()
  const [counts, setCounts] = useState(null)
  const [failed, setFailed] = useState(false)

  const load = useCallback(() => {
    getAdminDashboard()
      .then((data) => {
        setCounts(data)
        setFailed(false)
      })
      .catch(() => setFailed(true))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <>
      <PageHeader
        title={`Welcome, ${user.name}`}
        documentTitle="Admin dashboard"
        intro="Keep OpenDoor trustworthy and its shared lists up to date."
      />
      {failed && (
        <Notice tone="error" className="mt-6">
          <p>We couldn't load the numbers on this page.</p>
          <Button variant="link" onClick={load}>
            Try again
          </Button>
        </Notice>
      )}
      <ul className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DashboardTile
          title="Employer verification"
          count={counts?.companies_waiting_for_verification ?? '–'}
          to="/admin/employers"
          linkLabel="Review companies"
        >
          Companies waiting for their registration number to be checked.
        </DashboardTile>
        <DashboardTile
          title="Posting approvals"
          count={counts?.postings_waiting_for_approval ?? '–'}
          to="/admin/job-postings"
          linkLabel="Review postings"
        >
          Job postings waiting for approval before job seekers can see them.
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
