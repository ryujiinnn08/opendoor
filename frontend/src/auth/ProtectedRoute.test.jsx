import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderRoutes } from '../test/renderWithProviders.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'

const routes = [
  { path: '/login', element: <p>Login page</p> },
  { path: '/candidate/dashboard', element: <p>Candidate dashboard</p> },
  {
    element: <ProtectedRoute roles={['admin']} />,
    children: [{ path: '/admin/categories', element: <p>Admin categories</p> }],
  },
]

describe('ProtectedRoute', () => {
  it('sends guests to login and remembers where they were going', () => {
    const { router } = renderRoutes(routes, { path: '/admin/categories' })

    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?next=%2Fadmin%2Fcategories')
  })

  it('sends users with the wrong role to their own dashboard', () => {
    renderRoutes(routes, {
      path: '/admin/categories',
      auth: { status: 'authenticated', role: 'candidate', user: { name: 'Maria' } },
    })

    expect(screen.getByText('Candidate dashboard')).toBeInTheDocument()
  })

  it('shows the page to users with the right role', () => {
    renderRoutes(routes, {
      path: '/admin/categories',
      auth: { status: 'authenticated', role: 'admin', user: { name: 'Admin' } },
    })

    expect(screen.getByText('Admin categories')).toBeInTheDocument()
  })

  it('waits while the session is being checked', () => {
    renderRoutes(routes, { path: '/admin/categories', auth: { status: 'loading' } })

    expect(screen.getByRole('status')).toHaveTextContent('Loading')
  })
})
