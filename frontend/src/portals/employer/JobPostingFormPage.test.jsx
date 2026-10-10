import { act, cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { postingFixture as fixture } from '../../test/postingFixture.js'
import { renderRoutes } from '../../test/renderWithProviders.jsx'
import JobPostingFormPage from './JobPostingFormPage.jsx'

vi.mock('../../api/masterData.js', () => ({
  getCategories: vi.fn(),
  getAccommodationGroups: vi.fn(),
}))
vi.mock('../../api/employer.js', () => ({
  getDepartments: vi.fn(),
  getEmployerProfile: vi.fn(),
}))
vi.mock('../../api/jobPostings.js', () => ({
  getJobPosting: vi.fn(),
  createJobPosting: vi.fn(),
  updateJobPosting: vi.fn(),
}))

const { getCategories, getAccommodationGroups } = await import('../../api/masterData.js')
const { getDepartments, getEmployerProfile } = await import('../../api/employer.js')
const { getJobPosting, createJobPosting } = await import('../../api/jobPostings.js')

const routes = [
  { path: '/employer/job-postings', element: <p>List page</p> },
  { path: '/employer/job-postings/new', element: <JobPostingFormPage /> },
  { path: '/employer/job-postings/:id/edit', element: <JobPostingFormPage /> },
]
const company = { id: 1, type: 'company', name: 'Acme Corp.', is_verified: true, verification_status: 'verified' }
const auth = (membership) => ({ status: 'authenticated', role: 'employer', user: { name: 'Ana', role: 'employer', membership } })
const owner = auth({ role: 'owner', employer: company, department: null })
const hr = auth({ role: 'hr', employer: company, department: { id: 5, name: 'IT' } })
const individual = auth({ role: 'owner', employer: { id: 2, type: 'individual', name: 'Maria Cruz' }, department: null })

describe('JobPostingFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getCategories.mockResolvedValue([{ id: 1, name: 'Information Technology' }])
    getAccommodationGroups.mockResolvedValue([
      {
        group: 'Work arrangement',
        accommodations: [{ id: 10, name: 'Remote work', description: 'The job can be done fully from home.', is_active: true }],
      },
    ])
    getDepartments.mockResolvedValue({ departments: [{ id: 5, name: 'IT' }, { id: 6, name: 'Human Resources' }], cap: 10, defaultLimit: 3 })
    getEmployerProfile.mockResolvedValue({ address: 'Makati City' })
  })

  it('lets company owners choose the department, but not HR officers', async () => {
    renderRoutes(routes, { path: '/employer/job-postings/new', auth: owner })
    expect(await screen.findByLabelText('Department')).toBeInTheDocument()

    cleanup()
    renderRoutes(routes, { path: '/employer/job-postings/new', auth: hr })
    await screen.findByLabelText('Job title')
    expect(screen.queryByLabelText('Department')).not.toBeInTheDocument()
  })

  it('fills in the location from the employer profile', async () => {
    renderRoutes(routes, { path: '/employer/job-postings/new', auth: hr })

    expect(await screen.findByLabelText('Location')).toHaveValue('Makati City')
  })

  it('keeps focus on the page heading when the form finishes loading', async () => {
    let finishCategories
    getCategories.mockReturnValue(new Promise((resolve) => (finishCategories = resolve)))
    renderRoutes(routes, { path: '/employer/job-postings/new', auth: hr })

    // After each navigation RootLayout focuses the page's heading, here while the form still loads.
    ;(await screen.findByRole('heading', { level: 1, name: 'Create a job posting' })).focus()
    await act(async () => finishCategories([{ id: 1, name: 'Information Technology' }]))

    await screen.findByLabelText('Job title')
    expect(screen.getByRole('heading', { level: 1, name: 'Create a job posting' })).toHaveFocus()
  })

  it("names the closing date section without repeating the date field's label", async () => {
    renderRoutes(routes, { path: '/employer/job-postings/new', auth: hr })

    const section = (await screen.findByRole('heading', { level: 2, name: 'When applications close' })).closest('section')
    expect(within(section).getByLabelText('Closing date')).toHaveAttribute('type', 'date')
  })

  it('lists what is missing when submitting an empty posting', async () => {
    renderRoutes(routes, { path: '/employer/job-postings/new', auth: hr })
    await userEvent.click(await screen.findByRole('button', { name: 'Submit for approval' }))

    const summary = screen.getByRole('heading', { name: 'There is a problem' }).parentElement
    expect(summary).toHaveFocus()
    expect(within(summary).getByRole('link', { name: 'Enter a job title.' })).toBeInTheDocument()
    expect(within(summary).getByRole('link', { name: 'Choose at least one accommodation your workplace provides.' })).toBeInTheDocument()
    expect(createJobPosting).not.toHaveBeenCalled()
  })

  it('saves a draft and goes back to the list', async () => {
    createJobPosting.mockResolvedValue({ ...fixture, id: 9, title: 'Clerk', status: 'draft' })
    renderRoutes(routes, { path: '/employer/job-postings/new', auth: hr })

    await userEvent.type(await screen.findByLabelText('Job title'), 'Clerk')
    await userEvent.click(screen.getByRole('button', { name: 'Save draft' }))

    expect(createJobPosting).toHaveBeenCalledWith(expect.objectContaining({ title: 'Clerk', location: 'Makati City', submit: false }))
    expect(await screen.findByText('List page')).toBeInTheDocument()
  })

  it('warns before sending an open posting back for approval', async () => {
    getJobPosting.mockResolvedValue({ ...fixture, employer: individual.user.membership.employer, department: null })
    renderRoutes(routes, { path: '/employer/job-postings/2/edit', auth: individual })

    expect(await screen.findByRole('button', { name: 'Save and send for approval' })).toBeInTheDocument()
    expect(screen.getByText(/Job seekers won't see it until it is approved again/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Note about Remote work/)).toHaveValue('Laptop and internet allowance provided.')
  })
})
