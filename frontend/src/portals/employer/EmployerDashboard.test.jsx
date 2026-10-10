import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoutes } from '../../test/renderWithProviders.jsx'
import EmployerDashboard from './EmployerDashboard.jsx'

vi.mock('../../api/employer.js', () => ({
  getDepartments: vi.fn(),
  getEmployerDashboard: vi.fn(),
}))

const { getDepartments, getEmployerDashboard } = await import('../../api/employer.js')

const company = { id: 1, type: 'company', name: 'Acme Corp.', is_verified: true, verification_status: 'verified' }
const auth = (membership) => ({ status: 'authenticated', role: 'employer', user: { name: 'Ana', role: 'employer', membership } })

describe('EmployerDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getDepartments.mockResolvedValue({ departments: [], cap: 10, defaultLimit: 3 })
  })

  it('counts the postings by status and links to them', async () => {
    getEmployerDashboard.mockResolvedValue({ postings: { draft: 2, pending: 1, open: 3, rejected: 0, closed: 0 } })
    renderRoutes([{ path: '/', element: <EmployerDashboard /> }], { auth: auth({ role: 'owner', employer: company, department: null }) })

    const tile = (await screen.findByRole('heading', { name: 'Job postings' })).closest('li')
    expect(await within(tile).findByText('3 open')).toBeInTheDocument()
    expect(within(tile).getByText('1 waiting for approval')).toBeInTheDocument()
    expect(within(tile).getByText('2 drafts')).toBeInTheDocument()
    expect(within(tile).queryByText(/rejected/)).not.toBeInTheDocument()
    expect(within(tile).getByRole('link', { name: 'Manage job postings' })).toHaveAttribute('href', '/employer/job-postings')
  })

  it("names the HR officer's department", async () => {
    getEmployerDashboard.mockResolvedValue({ postings: { draft: 0, pending: 0, open: 0, rejected: 0, closed: 0 } })
    renderRoutes([{ path: '/', element: <EmployerDashboard /> }], {
      auth: auth({ role: 'hr', employer: company, department: { id: 5, name: 'IT' } }),
    })

    const tile = (await screen.findByRole('heading', { name: 'IT job postings' })).closest('li')
    expect(await within(tile).findByText('No job postings yet.')).toBeInTheDocument()
  })

  it('says when the posting counts cannot be loaded, and tries again', async () => {
    getEmployerDashboard
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce({ postings: { draft: 0, pending: 0, open: 3, rejected: 0, closed: 0 } })
    renderRoutes([{ path: '/', element: <EmployerDashboard /> }], { auth: auth({ role: 'owner', employer: company, department: null }) })

    const tile = (await screen.findByRole('heading', { name: 'Job postings' })).closest('li')
    expect(await within(tile).findByText("We couldn't load your posting counts.")).toBeInTheDocument()
    await userEvent.click(within(tile).getByRole('button', { name: 'Try again' }))

    expect(await within(tile).findByText('3 open')).toBeInTheDocument()
    expect(within(tile).queryByText("We couldn't load your posting counts.")).not.toBeInTheDocument()
  })

  it('says when the team cannot be loaded, and tries again', async () => {
    getEmployerDashboard.mockResolvedValue({ postings: { draft: 0, pending: 0, open: 0, rejected: 0, closed: 0 } })
    getDepartments
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce({
        departments: [{ id: 5, name: 'IT', places_used: 1, effective_limit: 2, hr_officers: [{ id: 9 }] }],
        cap: 10,
        defaultLimit: 3,
      })
    renderRoutes([{ path: '/', element: <EmployerDashboard /> }], { auth: auth({ role: 'owner', employer: company, department: null }) })

    const tile = (await screen.findByRole('heading', { name: 'Team' })).closest('li')
    expect(await within(tile).findByText("We couldn't load your team.")).toBeInTheDocument()
    await userEvent.click(within(tile).getByRole('button', { name: 'Try again' }))

    expect(await within(tile).findByText('IT: 1 of 2 places used')).toBeInTheDocument()
  })
})
