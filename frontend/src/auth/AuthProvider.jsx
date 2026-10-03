import { useCallback, useEffect, useMemo, useState } from 'react'
import * as authApi from '../api/auth.js'
import { setUnauthorizedHandler } from '../api/client.js'
import { AuthContext } from './authContext.js'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading') // 'loading' | 'guest' | 'authenticated'

  const applyUser = useCallback((nextUser) => {
    setUser(nextUser)
    setStatus(nextUser ? 'authenticated' : 'guest')
  }, [])

  // Restore the session on page load: the cookie survives refreshes, the React state does not.
  useEffect(() => {
    setUnauthorizedHandler(() => applyUser(null))
    authApi
      .fetchCurrentUser()
      .then(applyUser)
      .catch(() => applyUser(null))
  }, [applyUser])

  const login = useCallback(
    async (values) => {
      const loggedIn = await authApi.login(values)
      applyUser(loggedIn)
      return loggedIn
    },
    [applyUser],
  )

  const register = useCallback(
    async (values) => {
      const created = await authApi.register(values)
      applyUser(created)
      return created
    },
    [applyUser],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      applyUser(null)
    }
  }, [applyUser])

  const value = useMemo(
    () => ({ user, role: user?.role ?? null, status, login, register, logout }),
    [user, status, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
