import { act, cleanup, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { postingFixture as fixture } from '../../test/postingFixture.js'
import { renderRoutes } from '../../test/renderWithProviders.jsx'
import PostingApprovalsPage from './PostingApprovalsPage.jsx'
import PostingReviewPage from './PostingReviewPage.jsx'

vi.mock('../../api/admin.js', () => ({
  getPostingQueue: vi.fn(),
  getPostingForReview: vi.fn(),
  decidePosting: vi.fn(),
}))

const { getPostingQueue, getPostingForReview, decidePosting } = await import('../../api/admin.js')

const routes = [
  { path: '/admin/job-postings', element: <PostingApprovalsPage /> },
  { path: '/admin/job-postings/:id', element: <PostingReviewPage /> },
]
const admin = { status: 'authenticated', role: 'admin', user: { name: 'Admin', role: 'admin' } }
const waiting = { ...fixture, status: 'pending', approved_at: null, actions: undefined }

describe('PostingReviewPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('offers approve and reject only for waiting postings', async () => {
    getPostingForReview.mockResolvedValue({ ...waiting, changed_after_approval: true })
    renderRoutes(routes, { path: '/admin/job-postings/2', auth: admin })

    expect(await screen.findByRole('button', { name: 'Approve' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument()
    expect(screen.getByText(/approved before and has since been changed/)).toBeInTheDocument()

    cleanup()
    getPostingForReview.mockResolvedValue({ ...fixture, status: 'open' })
    renderRoutes(routes, { path: '/admin/job-postings/2', auth: admin })
    await screen.findByRole('heading', { level: 1, name: 'Junior Web Developer' })
    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
  })

  it('approves a posting and goes back to the queue with a message', async () => {
    getPostingForReview.mockResolvedValue(waiting)
    decidePosting.mockResolvedValue({ ...fixture, status: 'open' })
    getPostingQueue.mockResolvedValue([])
    renderRoutes(routes, { path: '/admin/job-postings/2', auth: admin })

    await userEvent.click(await screen.findByRole('button', { name: 'Approve' }))
    const dialog = screen.getByRole('dialog', { name: 'Approve "Junior Web Developer"?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Approve posting' }))

    expect(decidePosting).toHaveBeenCalledWith(2, 'approve', undefined, fixture.updated_at)
    expect(await screen.findByText('"Junior Web Developer" is approved and open to job seekers.')).toBeInTheDocument()
  })

  it('shows the employer verification status, even when not verified', async () => {
    getPostingForReview.mockResolvedValue({
      ...waiting,
      employer: { ...fixture.employer, is_verified: false, verification_status: 'pending' },
    })
    renderRoutes(routes, { path: '/admin/job-postings/2', auth: admin })

    expect(await screen.findByText('Verification: waiting for review')).toBeInTheDocument()
  })

  it('keeps the dialog open while deciding, and shows why a decision was refused', async () => {
    let refuse
    getPostingForReview.mockResolvedValue(waiting)
    decidePosting.mockReturnValue(new Promise((resolve, reject) => (refuse = reject)))
    renderRoutes(routes, { path: '/admin/job-postings/2', auth: admin })

    await userEvent.click(await screen.findByRole('button', { name: 'Approve' }))
    await userEvent.click(screen.getByRole('button', { name: 'Approve posting' }))
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('dialog', { name: 'Approve "Junior Web Developer"?' })).toBeInTheDocument()

    await act(async () =>
      refuse({ response: { status: 409, data: { message: 'This posting changed while you were reviewing it.' } } }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent('This posting changed while you were reviewing it.')
  })

  it('says when an approved posting shows as closed because its date passed', async () => {
    getPostingForReview.mockResolvedValue(waiting)
    decidePosting.mockResolvedValue({ ...fixture, status: 'closed', closed_automatically: true })
    getPostingQueue.mockResolvedValue([])
    renderRoutes(routes, { path: '/admin/job-postings/2', auth: admin })

    await userEvent.click(await screen.findByRole('button', { name: 'Approve' }))
    await userEvent.click(screen.getByRole('button', { name: 'Approve posting' }))

    expect(
      await screen.findByText('"Junior Web Developer" is approved. It shows as Closed until the employer chooses a new closing date.'),
    ).toBeInTheDocument()
  })

  it('marks accommodations that are no longer offered', async () => {
    getPostingForReview.mockResolvedValue({
      ...waiting,
      accommodations: [
        ...fixture.accommodations,
        { id: 3, name: 'Accessible parking', group_name: 'Physical access', note: null, is_active: false },
      ],
    })
    renderRoutes(routes, { path: '/admin/job-postings/2', auth: admin })

    expect(await screen.findByText('Accessible parking (no longer offered)')).toBeInTheDocument()
  })
})

describe('PostingApprovalsPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists waiting postings with who posted them', async () => {
    getPostingQueue.mockResolvedValue([{ ...waiting, changed_after_approval: true }])
    renderRoutes(routes, { path: '/admin/job-postings', auth: admin })

    const link = await screen.findByRole('link', { name: 'Junior Web Developer' })
    expect(link).toHaveAttribute('href', '/admin/job-postings/2')
    expect(getPostingQueue).toHaveBeenCalledWith('pending')
    expect(screen.getByText('Acme Corp.')).toBeInTheDocument()
    expect(screen.getByText('Changed after approval')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Waiting (1)' })).toBeInTheDocument()
  })

  it('ignores an earlier list that arrives after the tab changed', async () => {
    let finishFirst
    getPostingQueue
      .mockReturnValueOnce(new Promise((resolve) => (finishFirst = resolve)))
      .mockResolvedValueOnce([{ ...fixture, id: 8, title: 'Payroll clerk', status: 'rejected', rejection_reason: 'Add the duties.' }])
    renderRoutes(routes, { path: '/admin/job-postings', auth: admin })

    await userEvent.click(screen.getByRole('link', { name: 'Rejected' }))
    expect(await screen.findByRole('heading', { level: 2, name: 'Rejected (1)' })).toBeInTheDocument()
    await act(async () => finishFirst([waiting]))

    expect(screen.queryByText('Junior Web Developer')).not.toBeInTheDocument()
    expect(screen.getByText('Payroll clerk')).toBeInTheDocument()
  })

  it('offers Try again when the list cannot be loaded', async () => {
    getPostingQueue.mockRejectedValueOnce(new Error('Network Error')).mockResolvedValueOnce([waiting])
    renderRoutes(routes, { path: '/admin/job-postings', auth: admin })

    expect(await screen.findByText(/We could not reach OpenDoor/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('heading', { level: 2, name: 'Waiting (1)' })).toBeInTheDocument()
    expect(screen.queryByText(/We could not reach OpenDoor/)).not.toBeInTheDocument()
  })
})
