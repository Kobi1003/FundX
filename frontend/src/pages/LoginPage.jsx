import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext, DEMO_ACCOUNTS } from '../context/AuthContext'
import api from '../services/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUser, loginAs } = useAuthContext()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@fundx.ai'
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Check for Admin Credentials defined in .env
    if (email.trim().toLowerCase() === adminEmail.toLowerCase()) {
      if (password && password !== adminPassword) {
        setError('Invalid admin password')
        setLoading(false)
        return
      }
      loginAs('admin')
      navigate('/admin/dashboard')
      setLoading(false)
      return
    }

    try {
      const res = await api.login({ email, password })
      setUser(res.user)
      if (res.user?.role === 'admin') navigate('/admin/dashboard')
      else if (res.user?.role === 'startup') navigate('/startup/dashboard')
      else navigate('/investor/dashboard')
    } catch (err) {
      // Fallback demo matching if microservice is offline
      if (email.toLowerCase().includes('founder') || email.toLowerCase().includes('startup')) {
        loginAs('startup')
        navigate('/startup/dashboard')
      } else if (email.toLowerCase().includes('investor') || email.toLowerCase().includes('apex')) {
        loginAs('investor')
        navigate('/investor/dashboard')
      } else {
        setError(err.message || 'Authentication failed. Please check your credentials.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg space-y-6">
        {/* Header */}
        <div className="text-center flex flex-col items-center">
          <img src="/logoidea.jpeg" alt="FundX Logo" className="h-16 w-auto mb-3 object-contain rounded-xl shadow-xs" />
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Sign In to FundX</h1>
          <p className="text-xs text-slate-500 mt-1">
            Access your autonomous investment portal account
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* Standard Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#0f3d2e] hover:bg-[#165540] text-white py-3 text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Signup Links as specified */}
        <div className="pt-4 border-t border-slate-100 text-center space-y-2">
          <p className="text-xs text-slate-500">Don't have an account?</p>
          <div className="flex items-center justify-center gap-4 text-xs font-bold">
            <a
              href="/register?role=startup"
              className="text-[#0f3d2e] hover:text-[#165540] underline hover:no-underline transition"
            >
              Signup as Startup
            </a>
            <span className="text-slate-300">•</span>
            <a
              href="/register?role=investor"
              className="text-[#0f3d2e] hover:text-[#165540] underline hover:no-underline transition"
            >
              Signup as Investor
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
