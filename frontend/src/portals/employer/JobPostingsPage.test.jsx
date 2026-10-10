import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { closingDateRange } from '../../lib/postingOptions.js'
import { postingFixture as fixture } from '../../test/postingFixture.js'
import { renderRoutes } from '../../test/renderWithProviders.jsx'
import JobPostingsPage from './JobPostingsPage.jsx'

vi.mock('../../api/jobPostings.js', () => ({
  getJobPostings: vi.fn(),
  changePostingStatus: vi.fn(),
  deleteJobPosting: vi.fn(),
}))
vi.mock('../../api/employer.js', () => ({
  getDepartments: vi.fn(),
}))

const { getJobPostings, changePostingStatus } = await import('../../api/jobPostings.js')
const { getDepartments } = await import('../../api/employer.js')

const routes = [{ path: '/employer/job-postings', element: <JobPostingsPage /> }]
const company = { id: 1, type: 'company', name: 'Acme Corp.', is_verified: true, verification_status: 'verified' }
const auth = (membership) => ({ status: 'authenticated', role: 'employer', user: { name: 'Ana', role: 'employer', membership } })
const owner = auth({ role: 'owner', employer: company, department: null })
const hr = auth({ role: 'hr', employer: company, department: { id: 5, name: 'IT' } })
const individual = auth({ role: 'owner', employer: { id: 2, type: 'individual', name: 'Maria Cruz' }, department: null })

describe('JobPostingsPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows only the actions the server allows', async () => {
    getJobPostings.mockResolvedValue([
      { ...fixture, id: 1, title: 'Data encoder', status: 'draft', actions: ['edit', 'delete'] },
      { ...fixture, id: 2, title: 'Junior Web Developer', status: 'open', actions: ['edit', 'close', 'change_closing_date', 'delete'] },
    ])
    renderRoutes(routes, { path: '/employer/job-postings', auth: individual })

    expect(await screen.findByRole('button', { name: 'Close Junior Web Developer' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close Data encoder' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit Data encoder' })).toHaveAttribute('href', '/employer/job-postings/1/edit')
  })

  it('closes a posting after confirming, and says so', async () => {
    const announce = vi.fn()
    getJobPostings.mockResolvedValue([{ ...fixture, actions: ['edit', 'close', 'change_closing_date', 'delete'] }])
    changePostingStatus.mockResolvedValue({ ...fixture, status: 'closed', actions: ['edit', 'reopen', 'delete'] })
    renderRoutes(routes, { path: '/employer/job-postings', auth: individual, announce })

    await userEvent.click(await screen.findByRole('button', { name: 'Close Junior Web Developer' }))
    const dialog = screen.getByRole('dialog', { name: 'Close "Junior Web Developer"?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close posting' }))

    expect(changePostingStatus).toHaveBeenCalledWith(2, 'close', undefined)
    expect(await screen.findByText('"Junior Web Developer" is closed.')).toBeInTheDocument()
    expect(announce).toHaveBeenCalledWith('"Junior Web Developer" is closed.')
    expect(getJobPostings).toHaveBeenCalledTimes(2)
  })

  it('gives company owners a department filter but not HR officers', async () => {
    getJobPostings.mockResolvedValue([])
    getDepartments.mockResolvedValue({ departments: [{ id: 5, name: 'IT' }], cap: 10, defaultLimit: 3 })
    renderRoutes(routes, { path: '/employer/job-postings', auth: owner })
    expect(await screen.findByLabelText('Department')).toBeInTheDocument()

    cleanup()
    renderRoutes(routes, { path: '/employer/job-postings', auth: hr })
    await screen.findByText(/No job postings yet/)
    expect(screen.queryByLabelText('Department')).not.toBeInTheDocument()
    expect(getDepartments).toHaveBeenCalledTimes(1)
  })

  it('says what to do when there are no postings', async () => {
    getJobPostings.mockResolvedValue([])
    renderRoutes(routes, { path: '/employer/job-postings', auth: individual })

    expect(await screen.findByText(/No job postings yet/)).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Create a job posting' })[0]).toHaveAttribute('href', '/employer/job-postings/new')
  })

  it('has no accessibility violations', async () => {
    getJobPostings.mockResolvedValue([{ ...fixture, actions: ['edit', 'delete'] }])
    const { container } = renderRoutes(routes, { path: '/employer/job-postings', auth: individual })
    await screen.findByRole('heading', { level: 3 })

    expect(await axe(container)).toHaveNoViolations()
  })

  it('keeps the dialog open while the request runs, then reports the result', async () => {
    let finish
    getJobPostings.mockResolvedValue([{ ...fixture, actions: ['edit', 'close', 'change_closing_date', 'delete'] }])
    changePostingStatus.mockReturnValue(new Promise((resolve) => (finish = resolve)))
    renderRoutes(routes, { path: '/employer/job-postings', auth: individual })

    await userEvent.click(await screen.findByRole('button', { name: 'Close Junior Web Developer' }))
    const dialog = screen.getByRole('dialog', { name: 'Close "Junior Web Developer"?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close posting' }))
    await userEvent.keyboard('{Escape}')

    expect(screen.getByRole('dialog', { name: 'Close "Junior Web Developer"?' })).toBeInTheDocument()
    await act(async () => finish({ ...fixture, status: 'closed', actions: ['edit', 'reopen', 'delete'] }))
    expect(await screen.findByText('"Junior Web Developer" is closed.')).toBeInTheDocument()
  })

  it('moves focus to the posting after closing it, when its button is gone', async () => {
    getJobPostings
      .mockResolvedValueOnce([{ ...fixture, actions: ['edit', 'close', 'change_closing_date', 'delete'] }])
      .mockResolvedValueOnce([{ ...fixture, status: 'closed', actions: ['edit', 'reopen', 'delete'] }])
    changePostingStatus.mockResolvedValue({ ...fixture, status: 'closed' })
    renderRoutes(routes, { path: '/employer/job-postings', auth: individual })

    await userEvent.click(await screen.findByRole('button', { name: 'Close Junior Web Developer' }))
    await userEvent.click(screen.getByRole('button', { name: 'Close posting' }))

    await screen.findByText('"Junior Web Developer" is closed.')
    await waitFor(() => expect(screen.getByRole('link', { name: 'Junior Web Developer' })).toHaveFocus())
  })

  it('ignores an earlier list that arrives after the filter changed', async () => {
    let finishFirst
    getJobPostings
      .mockReturnValueOnce(new Promise((resolve) => (finishFirst = resolve)))
      .mockResolvedValueOnce([{ ...fixture, id: 7, title: 'Data encoder', status: 'draft', actions: ['edit', 'delete'] }])
    renderRoutes(routes, { path: '/employer/job-postings', auth: individual })

    await userEvent.click(screen.getByRole('link', { name: 'Drafts' }))
    expect(await screen.findByRole('heading', { name: 'Drafts (1)' })).toBeInTheDocument()
    await act(async () => finishFirst([{ ...fixture, actions: ['edit', 'delete'] }]))

    expect(screen.getByRole('heading', { name: 'Drafts (1)' })).toBeInTheDocument()
    expect(screen.queryByText('Junior Web Developer')).not.toBeInTheDocument()
  })

  it('ignores a department in the address that is not a number', async () => {
    getDepartments.mockResolvedValue({ departments: [{ id: 5, name: 'IT' }], cap: 10, defaultLimit: 3 })
    // Like the server: a department that isn't a whole number is refused with a 422.
    getJobPostings.mockImplementation(({ department }) =>
      /^\d*$/.test(department)
        ? Promise.resolve([{ ...fixture, actions: ['edit', 'delete'] }])
        : Promise.reject(validationError('department', 'The department field must be an integer.')),
    )
    renderRoutes(routes, { path: '/employer/job-postings?department=abc', auth: owner })

    expect(await screen.findByRole('heading', { name: 'All postings (1)' })).toBeInTheDocument()
    expect(getJobPostings).toHaveBeenCalledWith({ status: 'all', department: '' })
  })

  it('says the list could not be loaded when the server refuses the request', async () => {
    getJobPostings.mockRejectedValue(validationError('status', 'The selected status is invalid.'))
    renderRoutes(routes, { path: '/employer/job-postings', auth: individual })

    expect(await screen.findByText('Something went wrong. Please try again.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
    expect(screen.queryByText('Loading job postings…')).not.toBeInTheDocument()
  })

  it('names the department when the filtered list is empty', async () => {
    getDepartments.mockResolvedValue({ departments: [{ id: 5, name: 'IT' }], cap: 10, defaultLimit: 3 })
    getJobPostings.mockResolvedValue([])
    renderRoutes(routes, { path: '/employer/job-postings?department=5', auth: owner })
    expect(await screen.findByText('No job postings in IT yet.')).toBeInTheDocument()
    expect(screen.queryByText(/No job postings yet/)).not.toBeInTheDocument()

    cleanup()
    renderRoutes(routes, { path: '/employer/job-postings?status=draft&department=5', auth: owner })
    expect(await screen.findByText('No drafts in IT.')).toBeInTheDocument()
  })

  it('says when the departments for the filter cannot be loaded', async () => {
    getDepartments.mockRejectedValue(new Error('Network Error'))
    getJobPostings.mockResolvedValue([])
    renderRoutes(routes, { path: '/employer/job-postings', auth: owner })

    await waitFor(() =>
      expect(screen.getByLabelText('Department')).toHaveAccessibleDescription(/We couldn't load your departments\./),
    )
  })

  it('shows a closing date the server refuses on the date field', async () => {
    getJobPostings.mockResolvedValue([{ ...fixture, actions: ['edit', 'close', 'change_closing_date', 'delete'] }])
    changePostingStatus.mockRejectedValue(validationError('closes_on', 'Choose a later closing date.'))
    renderRoutes(routes, { path: '/employer/job-postings', auth: individual })

    await userEvent.click(await screen.findByRole('button', { name: 'Change closing date Junior Web Developer' }))
    const dialog = screen.getByRole('dialog')
    const field = within(dialog).getByLabelText('New closing date')
    fireEvent.change(field, { target: { value: closingDateRange().min } })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Change closing date' }))

    await waitFor(() => expect(field).toHaveAttribute('aria-invalid', 'true'))
    expect(field).toHaveAccessibleDescription(/Choose a later closing date\./)
  })
})

function validationError(field, message) {
  return { response: { status: 422, data: { message, errors: { [field]: [message] } } } }
}
