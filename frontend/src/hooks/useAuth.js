import { useAuthContext } from '../context/AuthContext'

export function useAuth() {
  const context = useAuthContext()
  return (
    context || {
      user: { id: 'demo-user', full_name: 'Demo User', role: 'startup' },
      loading: false,
    }
  )
}

export default useAuth
