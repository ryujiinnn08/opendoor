import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

/**
 * { user, role, status: 'loading' | 'guest' | 'authenticated', login, register, logout }
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
