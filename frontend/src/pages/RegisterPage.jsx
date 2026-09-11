import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import api from '../services/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setUser } = useAuthContext()

  const [roleTab, setRoleTab] = useState('startup') // 'startup' or 'investor'

  // Startup form fields
  const [startupForm, setStartupForm] = useState({
    name: '',
    email: '',
    password: '',
    industry: 'CleanTech',
    gst_number: '',
    incorporation_cert: 'INCORPORATION_CERTIFICATE.pdf',
  })

  // Investor form fields
  const [investorForm, setInvestorForm] = useState({
    name: '',
    email: '',
    password: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleStartupSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await api.register({
        role: 'startup',
        ...startupForm,
      })
      setUser(res.user)
      setSuccess('Startup account registered successfully!')
      setTimeout(() => navigate('/startup/dashboard'), 800)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInvestorSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await api.register({
        role: 'investor',
        ...investorForm,
      })
      setUser(res.user)
      setSuccess('Investor account registered successfully!')
      setTimeout(() => navigate('/investor/dashboard'), 800)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0f3d2e] to-[#1c5c46] text-white font-black text-xl mb-3 shadow-xs">
            FX
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Create Your FundX Account</h1>
          <p className="text-xs text-slate-500 mt-1">
            Choose your account role to join the autonomous investment arena
          </p>
        </div>

        {/* Role Tab Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200">
          <button
            type="button"
            onClick={() => setRoleTab('startup')}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
              roleTab === 'startup'
                ? 'bg-[#0f3d2e] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🚀 Startup Registration
          </button>
          <button
            type="button"
            onClick={() => setRoleTab('investor')}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
              roleTab === 'investor'
                ? 'bg-[#0f3d2e] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💼 Investor Registration
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 mb-4">
            {success}
          </div>
        )}

        {/* Startup Registration Form */}
        {roleTab === 'startup' && (
          <form onSubmit={handleStartupSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company / Founder Name</label>
              <input
                type="text"
                required
                placeholder="e.g. AeroGrid Tech"
                value={startupForm.name}
                onChange={(e) => setStartupForm({ ...startupForm, name: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Work Email</label>
              <input
                type="email"
                required
                placeholder="founder@aerogrid.io"
                value={startupForm.email}
                onChange={(e) => setStartupForm({ ...startupForm, email: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={startupForm.password}
                onChange={(e) => setStartupForm({ ...startupForm, password: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Industry Sector</label>
              <select
                value={startupForm.industry}
                onChange={(e) => setStartupForm({ ...startupForm, industry: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="CleanTech">CleanTech & Energy</option>
                <option value="FinTech">FinTech & Payments</option>
                <option value="HealthTech">HealthTech & Bio</option>
                <option value="Robotics">Robotics & Industrial Automation</option>
                <option value="AI / DeepTech">AI / DeepTech</option>
                <option value="B2B SaaS">B2B SaaS</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">GST Number (GSTIN)</label>
              <input
                type="text"
                required
                placeholder="e.g. 27AABCA1234F1Z8"
                value={startupForm.gst_number}
                onChange={(e) => setStartupForm({ ...startupForm, gst_number: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono font-bold text-slate-900 uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                15-digit statutory GST registry identifier
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Incorporation Certificate</label>
              <input
                type="text"
                required
                placeholder="e.g. AEROGRID_INCORPORATION_ROC_2024.pdf"
                value={startupForm.incorporation_cert}
                onChange={(e) => setStartupForm({ ...startupForm, incorporation_cert: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Document file name for Registrar of Companies (ROC) filing
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#0f3d2e] hover:bg-[#165540] text-white py-3 text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating Startup Account...' : 'Register Startup Account →'}
            </button>
          </form>
        )}

        {/* Investor Registration Form */}
        {roleTab === 'investor' && (
          <form onSubmit={handleInvestorSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Vikram Mehta"
                value={investorForm.name}
                onChange={(e) => setInvestorForm({ ...investorForm, name: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="investor@nexusangels.io"
                value={investorForm.email}
                onChange={(e) => setInvestorForm({ ...investorForm, email: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={investorForm.password}
                onChange={(e) => setInvestorForm({ ...investorForm, password: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600">
              ℹ️ After registration, upload your CV in your profile to complete AI accreditation and unlock Dealroom negotiations.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#0f3d2e] hover:bg-[#165540] text-white py-3 text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating Investor Account...' : 'Register Investor Account →'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-emerald-800 hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  )
}
