import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'

export const DEMO_ACCOUNTS = {
  admin: {
    id: 'admin-user',
    full_name: 'FundX Super Admin',
    email: 'admin@fundx.ai',
    role: 'admin',
    is_verified: true,
  },
  startup: {
    id: 'founder-aerogrid',
    full_name: 'Priya Sharma',
    email: 'founder@aerogrid.io',
    role: 'startup',
    startup_id: 'startup-aerogrid',
    startup_name: 'AeroGrid Tech',
    industry: 'CleanTech',
    is_verified: true,
  },
  investor: {
    id: 'investor-elena',
    full_name: 'Elena Rostova',
    email: 'elena@apexhorizon.com',
    role: 'investor',
    investor_id: 'investor-elena',
    firm: 'Apex Horizon Capital',
    is_verified: true,
  },
  investor_unverified: {
    id: 'investor-david',
    full_name: 'David Miller',
    email: 'david.miller@angelinvest.org',
    role: 'investor',
    investor_id: 'investor-david',
    firm: 'Private Angel',
    is_verified: false,
  },
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('fundx_user')
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return null
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('fundx_user', JSON.stringify(user))
      } else {
        localStorage.removeItem('fundx_user')
      }
    } catch {
      // ignore
    }
  }, [user])

  const loginAs = (roleKey) => {
    const acc = DEMO_ACCOUNTS[roleKey]
    if (acc) {
      setUser({ ...acc })
    }
  }

  const setUserProfile = (newUser) => {
    setUser(newUser)
  }

  const updateActiveUser = (fields) => {
    setUser((prev) => (prev ? { ...prev, ...fields } : fields))
  }

  const logout = () => {
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser: setUserProfile,
        updateActiveUser,
        loginAs,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return ctx
}
