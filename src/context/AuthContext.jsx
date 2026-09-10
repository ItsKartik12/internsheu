import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

// Demo-only auth store. Replace the boolean state with a real session
// check (JWT/cookie validation, etc.) when a backend is wired up.
export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  function login() {
    setIsAuthenticated(true)
  }

  function logout() {
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
