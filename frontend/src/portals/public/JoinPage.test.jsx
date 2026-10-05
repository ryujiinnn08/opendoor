import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderRoutes } from '../../test/renderWithProviders.jsx'
import JoinPage from './JoinPage.jsx'

vi.mock('../../api/invites.js', () => ({
  getInvite: vi.fn(),
  acceptInvite: vi.fn(),
}))

const { getInvite } = await import('../../api/invites.js')
const routes = [{ path: '/join/:code', element: <JoinPage /> }]

describe('JoinPage', () => {
  beforeEach(() => vi.clearAllMocks())

  it('explains why a link cannot be used', async () => {
    getInvite.mockResolvedValue({ available: false, reason: 'expired', message: 'This invite link has expired.' })

    renderRoutes(routes, { path: '/join/old-code' })

    expect(await screen.findByRole('heading', { name: "This invite link can't be used" })).toBeInTheDocument()
    expect(screen.getByText('This invite link has expired.')).toBeInTheDocument()
    expect(screen.getByText('Ask the company owner for a new invite link.')).toBeInTheDocument()
  })

  it('shows the company and department, and a sign-up form for guests', async () => {
    getInvite.mockResolvedValue({
      available: true,
      company: 'Acme Corp.',
      department: 'IT',
      expires_at: '2026-10-12T00:00:00Z',
    })

    renderRoutes(routes, { path: '/join/good-code' })

    expect(await screen.findByRole('heading', { name: 'Join IT at Acme Corp.' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create account and join' })).toBeInTheDocument()
    expect(screen.getByLabelText('Work email address')).toBeInTheDocument()
  })

  it('asks people who already belong to an employer to log out first', async () => {
    getInvite.mockResolvedValue({ available: true, company: 'Acme Corp.', department: 'IT', expires_at: '2026-10-12T00:00:00Z' })

    renderRoutes(routes, {
      path: '/join/good-code',
      auth: { status: 'authenticated', role: 'candidate', user: { name: 'Maria', role: 'candidate' } },
    })

    expect(await screen.findByText(/who can't join another company/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument()
  })
})
