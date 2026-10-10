import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoutes } from '../../test/renderWithProviders.jsx'
import AdminDashboard from './AdminDashboard.jsx'

vi.mock('../../api/admin.js', () => ({
  getAdminDashboard: vi.fn(),
}))

const { getAdminDashboard } = await import('../../api/admin.js')

const routes = [{ path: '/', element: <AdminDashboard /> }]
const admin = { status: 'authenticated', role: 'admin', user: { name: 'Admin', role: 'admin' } }
const counts = {
  companies_waiting_for_verification: 2,
  postings_waiting_for_approval: 1,
  categories: 10,
  active_accommodations: 18,
  hr_per_department_cap: 10,
}

describe('AdminDashboard', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the counts on each tile', async () => {
    getAdminDashboard.mockResolvedValue(counts)
    renderRoutes(routes, { auth: admin })

    const tile = screen.getByRole('heading', { name: 'Posting approvals' }).closest('li')
    expect(await within(tile).findByText('1')).toBeInTheDocument()
    expect(within(tile).getByRole('link', { name: 'Review postings' })).toHaveAttribute('href', '/admin/job-postings')
  })

  it('says when the numbers cannot be loaded, and tries again', async () => {
    getAdminDashboard.mockRejectedValueOnce(new Error('Network Error')).mockResolvedValueOnce(counts)
    renderRoutes(routes, { auth: admin })

    expect(await screen.findByText("We couldn't load the numbers on this page.")).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    const tile = screen.getByRole('heading', { name: 'Posting approvals' }).closest('li')
    expect(await within(tile).findByText('1')).toBeInTheDocument()
    expect(screen.queryByText("We couldn't load the numbers on this page.")).not.toBeInTheDocument()
  })
})
