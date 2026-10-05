import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderRoutes } from '../test/renderWithProviders.jsx'
import GuestRoute from './GuestRoute.jsx'

const routes = [
  { element: <GuestRoute />, children: [{ path: '/login', element: <p>Login page</p> }] },
  { path: '/admin/dashboard', element: <p>Admin dashboard</p> },
  { path: '/admin/employers', element: <p>Employer verification</p> },
]
const admin = { status: 'authenticated', role: 'admin', user: { name: 'Admin', role: 'admin' } }

describe('GuestRoute', () => {
  it('shows the login page to guests', () => {
    renderRoutes(routes, { path: '/login' })

    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('sends logged-in users to the page they asked for', () => {
    renderRoutes(routes, { path: '/login?next=%2Fadmin%2Femployers', auth: admin })

    expect(screen.getByText('Employer verification')).toBeInTheDocument()
  })

  it('ignores links to other sites and uses the dashboard instead', () => {
    renderRoutes(routes, { path: '/login?next=https%3A%2F%2Fevil.example', auth: admin })

    expect(screen.getByText('Admin dashboard')).toBeInTheDocument()
  })
})
