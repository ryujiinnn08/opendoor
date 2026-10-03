import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ProtectedRoute from '../../auth/ProtectedRoute.jsx'
import { renderRoutes } from '../../test/renderWithProviders.jsx'
import PortalLayout from './PortalLayout.jsx'

const routes = [
  { path: '/', element: <p>Home page</p> },
  { path: '/login', element: <p>Login page</p> },
  {
    element: <ProtectedRoute roles={['admin']} />,
    children: [
      { element: <PortalLayout />, children: [{ path: '/admin/dashboard', element: <h1>Admin dashboard</h1> }] },
    ],
  },
]

describe('PortalLayout', () => {
  it('shows the menu for the role', () => {
    renderRoutes(routes, {
      path: '/admin/dashboard',
      auth: { status: 'authenticated', role: 'admin', user: { name: 'OpenDoor Admin' } },
    })

    const nav = screen.getByRole('navigation', { name: 'Admin portal' })
    expect(nav).toHaveTextContent('Categories')
    expect(nav).toHaveTextContent('Accommodation types')
    expect(screen.getByText('OpenDoor Admin')).toBeInTheDocument()
  })

  it('goes to the home page (not the login page) after logging out', async () => {
    const logout = vi.fn().mockResolvedValue()
    const announce = vi.fn()
    const { router } = renderRoutes(routes, {
      path: '/admin/dashboard',
      auth: { status: 'authenticated', role: 'admin', user: { name: 'OpenDoor Admin' }, logout },
      announce,
    })

    await userEvent.click(screen.getByRole('button', { name: 'Log out' }))

    expect(await screen.findByText('Home page')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
    expect(router.state.location.state).toEqual({ loggedOut: true })
    expect(logout).toHaveBeenCalled()
    expect(announce).toHaveBeenCalledWith('You have logged out.')
  })
})
