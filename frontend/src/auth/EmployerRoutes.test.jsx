import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderRoutes } from '../test/renderWithProviders.jsx'
import { RequireEmployerProfile, RequireNoEmployerProfile } from './EmployerRoutes.jsx'

const routes = [
  { element: <RequireNoEmployerProfile />, children: [{ path: '/employer/setup', element: <p>Setup page</p> }] },
  {
    element: <RequireEmployerProfile kinds={['owner', 'hr', 'individual']} />,
    children: [{ path: '/employer/dashboard', element: <p>Dashboard page</p> }],
  },
  {
    element: <RequireEmployerProfile kinds={['owner']} />,
    children: [{ path: '/employer/team', element: <p>Team page</p> }],
  },
]

const auth = (membership) => ({ status: 'authenticated', role: 'employer', user: { name: 'Ana', role: 'employer', membership } })
const company = { type: 'company', name: 'Acme Corp.' }

describe('employer route guards', () => {
  it('sends employers without a profile to the setup screen', () => {
    renderRoutes(routes, { path: '/employer/team', auth: auth(null) })

    expect(screen.getByText('Setup page')).toBeInTheDocument()
  })

  it('sends HR officers away from owner-only pages', () => {
    renderRoutes(routes, { path: '/employer/team', auth: auth({ role: 'hr', employer: company, department: { name: 'IT' } }) })

    expect(screen.getByText('Dashboard page')).toBeInTheDocument()
  })

  it('lets owners open owner pages, and keeps set-up employers off the setup screen', () => {
    const owner = auth({ role: 'owner', employer: company })

    renderRoutes(routes, { path: '/employer/team', auth: owner })
    expect(screen.getByText('Team page')).toBeInTheDocument()
  })

  it('keeps employers who already have a profile off the setup screen', () => {
    renderRoutes(routes, { path: '/employer/setup', auth: auth({ role: 'owner', employer: company }) })

    expect(screen.getByText('Dashboard page')).toBeInTheDocument()
  })
})
