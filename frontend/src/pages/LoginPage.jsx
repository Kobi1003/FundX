import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext, DEMO_ACCOUNTS } from '../context/AuthContext'
import api from '../services/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUser, loginAs } = useAuthContext()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await api.login({ email, password })
      setUser(res.user)
      if (res.user?.role === 'admin') navigate('/admin/dashboard')
      else if (res.user?.role === 'startup') navigate('/startup/dashboard')
      else navigate('/investor/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = (roleKey) => {
    loginAs(roleKey)
    if (roleKey === 'admin') navigate('/admin/dashboard')
    else if (roleKey === 'startup') navigate('/startup/dashboard')
    else navigate('/investor/dashboard')
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0f3d2e] to-[#1c5c46] text-white font-black text-xl mb-3 shadow-xs">
            FX
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Sign In to FundX</h1>
          <p className="text-xs text-slate-500 mt-1">
            Access your portal or select a quick demo evaluator profile
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* 1-Click Quick Demo Switchers */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 block">
            ⚡ 1-Click Demo Evaluation Profiles
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickLogin('admin')}
              className="rounded-lg bg-white border border-amber-300 p-2 text-left hover:bg-amber-100 transition cursor-pointer font-bold text-slate-900 shadow-2xs"
            >
              👑 Super Admin
              <span className="text-[10px] font-normal text-slate-500 block">Platform command</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('startup')}
              className="rounded-lg bg-white border border-amber-300 p-2 text-left hover:bg-amber-100 transition cursor-pointer font-bold text-slate-900 shadow-2xs"
            >
              🚀 Startup Founder
              <span className="text-[10px] font-normal text-slate-500 block">AeroGrid Tech</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('investor')}
              className="rounded-lg bg-white border border-amber-300 p-2 text-left hover:bg-amber-100 transition cursor-pointer font-bold text-slate-900 shadow-2xs"
            >
              💼 Verified Investor
              <span className="text-[10px] font-normal text-slate-500 block">Elena Rostova</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('investor_unverified')}
              className="rounded-lg bg-white border border-amber-300 p-2 text-left hover:bg-amber-100 transition cursor-pointer font-bold text-slate-900 shadow-2xs"
            >
              ⚠️ Unverified Investor
              <span className="text-[10px] font-normal text-slate-500 block">David (CV Gating)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-[10px] uppercase font-bold text-slate-400">or sign in with credentials</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        {/* Standard Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#0f3d2e] hover:bg-[#165540] text-white py-2.5 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
          Need an account?{' '}
          <Link to="/register" className="font-bold text-emerald-800 hover:underline">
            Register as Startup or Investor
          </Link>
        </div>
      </div>
  )
}
