import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderRoutes } from '../../test/renderWithProviders.jsx'
import LoginPage from './LoginPage.jsx'

const routes = [
  { path: '/login', element: <LoginPage /> },
  { path: '/employer/dashboard', element: <p>Employer dashboard</p> },
  { path: '/admin/categories', element: <p>Admin categories</p> },
]

function laravelError(status, data) {
  return Object.assign(new Error('Request failed'), { response: { status, data } })
}

async function submit(email, password) {
  if (email) await userEvent.type(screen.getByLabelText('Email address'), email)
  if (password) await userEvent.type(screen.getByLabelText('Password'), password)
  await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
}

describe('LoginPage', () => {
  it('asks for missing details without calling the server', async () => {
    const login = vi.fn()
    renderRoutes(routes, { path: '/login', auth: { login } })

    await submit()

    expect(login).not.toHaveBeenCalled()
    expect(screen.getByRole('link', { name: 'Enter your email address.' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toHaveAccessibleDescription('Error: Enter your email address.')
  })

  it("shows Laravel's message beside the field and in the summary", async () => {
    const message = 'These details do not match our records. Check your email and password.'
    const login = vi.fn().mockRejectedValue(laravelError(422, { errors: { email: [message] } }))
    renderRoutes(routes, { path: '/login', auth: { login } })

    await submit('maria@example.com', 'Wrong@123')

    expect(screen.getByRole('link', { name: message })).toBeInTheDocument()
    expect(screen.getByLabelText('Email address')).toHaveAccessibleDescription(`Error: ${message}`)
  })

  it('shows the suspended-account message', async () => {
    const message = 'This account has been suspended. Contact the OpenDoor administrators for help.'
    const login = vi.fn().mockRejectedValue(laravelError(403, { message }))
    renderRoutes(routes, { path: '/login', auth: { login } })

    await submit('maria@example.com', 'Secure@123')

    expect(screen.getByText(message)).toBeInTheDocument()
  })

  it('opens the dashboard for the logged-in role', async () => {
    const login = vi.fn().mockResolvedValue({ name: 'HR', role: 'employer' })
    renderRoutes(routes, { path: '/login', auth: { login } })

    await submit('hr@example.com', 'Secure@123')

    expect(login).toHaveBeenCalledWith({ email: 'hr@example.com', password: 'Secure@123' })
    expect(await screen.findByText('Employer dashboard')).toBeInTheDocument()
  })

  it('returns to the requested page after login', async () => {
    const login = vi.fn().mockResolvedValue({ name: 'Admin', role: 'admin' })
    renderRoutes(routes, { path: '/login?next=%2Fadmin%2Fcategories', auth: { login } })

    await submit('admin@opendoor.test', 'OpenDoor@2026')

    expect(await screen.findByText('Admin categories')).toBeInTheDocument()
  })
})
