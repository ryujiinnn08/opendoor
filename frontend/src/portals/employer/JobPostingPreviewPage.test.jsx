import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { postingFixture as fixture } from '../../test/postingFixture.js'
import { renderRoutes } from '../../test/renderWithProviders.jsx'
import JobPostingPreviewPage from './JobPostingPreviewPage.jsx'

vi.mock('../../api/jobPostings.js', () => ({
  getJobPosting: vi.fn(),
}))

const { getJobPosting } = await import('../../api/jobPostings.js')
const routes = [{ path: '/employer/job-postings/:id', element: <JobPostingPreviewPage /> }]

describe('JobPostingPreviewPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows the posting as job seekers will see it, with the reason it was rejected', async () => {
    getJobPosting.mockResolvedValue({ ...fixture, status: 'rejected', rejection_reason: 'Say what the job involves.', actions: ['edit', 'delete'] })
    renderRoutes(routes, { path: '/employer/job-postings/2' })

    expect(await screen.findByRole('heading', { level: 1, name: 'Junior Web Developer' })).toBeInTheDocument()
    expect(screen.getByText(/Say what the job involves\./)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit posting' })).toHaveAttribute('href', '/employer/job-postings/2/edit')
    expect(screen.getByRole('region', { name: 'Accommodations provided' })).toBeInTheDocument()
  })

  it('explains a posting that no longer exists', async () => {
    getJobPosting.mockRejectedValue({ response: { status: 404, data: { message: 'Not found.' } } })
    renderRoutes(routes, { path: '/employer/job-postings/99' })

    expect(await screen.findByText("This posting doesn't exist or was deleted.")).toBeInTheDocument()
  })
})
