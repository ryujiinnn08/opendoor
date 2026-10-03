import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { AuthContext } from '../auth/authContext.js'
import { AnnouncerContext } from '../components/ui/announcerContext.js'

/**
 * Renders route objects in a memory router with a fake auth state.
 */
export function renderRoutes(routes, { path = '/', auth = {}, announce = () => {} } = {}) {
  const authValue = {
    user: null,
    role: null,
    status: 'guest',
    login: async () => {},
    register: async () => {},
    logout: async () => {},
    ...auth,
  }
  const router = createMemoryRouter(routes, { initialEntries: [path] })

  const result = render(
    <AuthContext.Provider value={authValue}>
      <AnnouncerContext.Provider value={announce}>
        <RouterProvider router={router} />
      </AnnouncerContext.Provider>
    </AuthContext.Provider>,
  )

  return { ...result, router }
}
