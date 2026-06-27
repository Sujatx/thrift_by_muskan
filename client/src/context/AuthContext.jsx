import { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext()

const ADMIN_TOKEN_KEY = 'muse_admin_token'

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminToken, setAdminToken] = useState(null)
  const [adminLoading, setAdminLoading] = useState(true)

  // Load admin token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(ADMIN_TOKEN_KEY)
    if (savedToken) {
      setAdminToken(savedToken)
      setIsAdmin(true)
    }
    setAdminLoading(false)
  }, [])

  const login = (token) => {
    setAdminToken(token)
    setIsAdmin(true)
    localStorage.setItem(ADMIN_TOKEN_KEY, token)
  }

  const logout = () => {
    setAdminToken(null)
    setIsAdmin(false)
    localStorage.removeItem(ADMIN_TOKEN_KEY)
  }

  return (
    <AuthContext.Provider
      value={{
        isAdmin,
        adminToken,
        adminLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
