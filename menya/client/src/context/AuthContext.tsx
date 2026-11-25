import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { translateCurrent } from '../i18n'
import { apiClient, setAccessToken } from '../lib/api'
import { useApp } from './AppContext'
import type { AuthUser, Role } from '../types'

interface SessionResponse {
  user: AuthUser
  accessToken: string
}

export interface AuthResult {
  user: AuthUser | null
  error: string | null
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  register: (input: { name: string; email: string; password: string; program?: string; school?: string }) => Promise<AuthResult>
  logout: () => Promise<void>
  can: (...roles: Role[]) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function errorMessage(error: unknown) {
  return error instanceof Error ? translateCurrent(error.message) : translateCurrent('Unable to complete the request.')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setRole } = useApp()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const applySession = (session: SessionResponse) => {
    setAccessToken(session.accessToken)
    setUser(session.user)
    setRole(session.user.role)
  }

  useEffect(() => {
    let active = true
    apiClient
      .post<SessionResponse>('/auth/refresh')
      .then((session) => {
        if (!active) return
        applySession(session)
      })
      .catch(() => {
        if (active) setAccessToken(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const onExpired = () => {
      setUser(null)
      setAccessToken(null)
    }
    window.addEventListener('menya:auth-expired', onExpired)
    return () => {
      active = false
      window.removeEventListener('menya:auth-expired', onExpired)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const session = await apiClient.post<SessionResponse>('/auth/login', { email, password })
      applySession(session)
      return { user: session.user, error: null }
    } catch (error) {
      return { user: null, error: errorMessage(error) }
    }
  }

  const register = async (input: {
    name: string
    email: string
    password: string
    program?: string
    school?: string
  }): Promise<AuthResult> => {
    try {
      const session = await apiClient.post<SessionResponse>('/auth/register', input)
      applySession(session)
      return { user: session.user, error: null }
    } catch (error) {
      return { user: null, error: errorMessage(error) }
    }
  }

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch {
      /* sign out locally even if the network is unavailable */
    }
    setAccessToken(null)
    setUser(null)
    setRole('student')
  }

  const can = (...roles: Role[]) => Boolean(user && roles.includes(user.role))

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, can }}>
      {children}
    </AuthContext.Provider>
  )
}

// oxlint-disable-next-line react/only-export-components -- hook is colocated with its provider
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
