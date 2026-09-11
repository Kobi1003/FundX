import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import Button from '../components/Button'
import { useAuthContext } from '../context/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn, fetchProfile } = useAuthContext()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await signIn(email, password)
      const userProfile = await fetchProfile()
      if (!userProfile) {
        navigate('/register')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer title="Login">
      <Card>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Sign in to your AI Investment Arena account.
        </p>

        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Email</label>
            <input
              className="w-full rounded border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Password</label>
            <input
              className="w-full rounded border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>

          <p className="text-xs text-[var(--muted)] mt-2">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline">
              Register here
            </Link>
          </p>
        </form>
      </Card>
    </PageContainer>
  )
}
