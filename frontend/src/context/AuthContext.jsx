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
      if (token) {
        const response = await fetchCurrentUser()
        if (response?.user) {
          setUser(response.user)
          localStorage.setItem('user', JSON.stringify(response.user))
        } else if (response === null && !localStorage.getItem('user')) {
          // Unreachable backend or expired session
        }
      }
      setIsLoading(false)
    }
    syncSession()
  }, [token])

  function login(authData) {
    if (authData.token) {
      setToken(authData.token)
      localStorage.setItem('token', authData.token)
    }
    const userData = authData.user || authData
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
