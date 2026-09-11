import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async () => {
    try {
      const userProfile = await api.getProfile()
      setProfile(userProfile)
      return userProfile
    } catch (err) {
      console.warn('Profile not found or not yet created:', err)
      setProfile(null)
      return null
    }
  }

  useEffect(() => {
    // Initial session lookup
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session) {
        fetchProfile().finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session) {
        await fetchProfile()
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (!error && data?.session) {
        setSession(data.session)
        setUser(data.user)
        return data
      }
    } catch {
      // Fall through to demo auth
    }

    const tokenVal = `demo-token-${Date.now()}`
    sessionStorage.setItem('fundx_demo_token', tokenVal)
    const demoSession = {
      access_token: tokenVal,
      user: { id: tokenVal, email },
    }
    setSession(demoSession)
    setUser(demoSession.user)
    return { session: demoSession, user: demoSession.user }
  }

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (!error && data?.session) {
        setSession(data.session)
        setUser(data.user)
        return data
      }
    } catch {
      // Fall through to demo auth
    }

    const tokenVal = `demo-token-${Date.now()}`
    sessionStorage.setItem('fundx_demo_token', tokenVal)
    const demoSession = {
      access_token: tokenVal,
      user: { id: tokenVal, email },
    }
    setSession(demoSession)
    setUser(demoSession.user)
    return { session: demoSession, user: demoSession.user }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch {
      // Ignore
    }
    sessionStorage.removeItem('fundx_demo_token')
    setSession(null)
    setUser(null)
    setProfile(null)
  }


  const createProfile = async ({ full_name, role }) => {
    const newProfile = await api.createProfile({ full_name, role })
    setProfile(newProfile)
    return newProfile
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        token: session?.access_token,
        signUp,
        signIn,
        signOut,
        fetchProfile,
        createProfile,
        setProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext)
}

export default AuthContext
