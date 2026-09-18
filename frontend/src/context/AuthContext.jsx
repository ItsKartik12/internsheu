import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { fetchCurrentUser } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(() => localStorage.getItem('token') || null)
  const [isLoading, setIsLoading] = useState(true)

  // Verify and sync token on initial mount only
  useEffect(() => {
    let isMounted = true
    async function syncSession() {
      let activeToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      let currentUser = null
      try {
        currentUser = storedUser ? JSON.parse(storedUser) : null
      } catch {}

      if (!activeToken && currentUser) {
        // Auto-recover session bridge token so backend queries succeed
        const role = currentUser.role || 'student'
        activeToken = `mock-token-${role}-${Date.now()}`
        setToken(activeToken)
        localStorage.setItem('token', activeToken)
      }

      if (activeToken) {
        try {
          const response = await fetchCurrentUser()
          if (isMounted && response?.user) {
            setUser(response.user)
            localStorage.setItem('user', JSON.stringify(response.user))
          }
        } catch {
          // Keep stored user on network error
        }
      }
      if (isMounted) {
        setIsLoading(false)
      }
    }
    syncSession()
    return () => {
      isMounted = false
    }
  }, [])

  const login = useCallback((authData) => {
    const userData = authData.user || authData
    const authToken = authData.token || `mock-token-${userData?.role || 'student'}-${Date.now()}`
    setToken(authToken)
    localStorage.setItem('token', authToken)
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }, [])

  const value = useMemo(() => ({
    user,
    token,
    role: user?.role ?? null,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    logout,
  }), [user, token, isLoading, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
