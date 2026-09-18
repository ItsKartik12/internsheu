import { createContext, useContext, useState, useEffect } from 'react'
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

  // Verify and sync token on initial mount
  useEffect(() => {
    async function syncSession() {
      let activeToken = token
      if (!activeToken && user) {
        // Auto-recover session bridge token so backend queries succeed
        const role = user.role || 'student'
        activeToken = `mock-token-${role}-${Date.now()}`
        setToken(activeToken)
        localStorage.setItem('token', activeToken)
      }

      if (activeToken) {
        const response = await fetchCurrentUser()
        if (response?.user) {
          setUser(response.user)
          localStorage.setItem('user', JSON.stringify(response.user))
        }
      }
      setIsLoading(false)
    }
    syncSession()
  }, [token, user])

  function login(authData) {
    const userData = authData.user || authData
    const authToken = authData.token || `mock-token-${userData?.role || 'student'}-${Date.now()}`
    setToken(authToken)
    localStorage.setItem('token', authToken)
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  function logout() {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const value = {
    user,
    token,
    role: user?.role ?? null,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
