import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

// Demo-only auth store. Replace with a real session check (JWT/cookie
// validation against a backend) when auth is wired up for real. `user`
// holds { id, identifier, role, name, studentId? } as resolved by the
// OTP verification step in Login.jsx.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  function login(nextUser) {
    setUser(nextUser)
  }

  function logout() {
    setUser(null)
  }

  const value = {
    user,
    role: user?.role ?? null,
    isAuthenticated: Boolean(user),
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
