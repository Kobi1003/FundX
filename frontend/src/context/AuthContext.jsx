import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState({
    id: 'demo-user',
    full_name: 'Demo User',
    role: 'startup',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .getProfile()
      .then((profile) => {
        if (profile) setUser(profile)
      })
      .catch(() => {
        // Fall back to default demo user profile
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext)
}
