import { useEffect, useState } from 'react'
import { useAuthContext } from '../../context/AuthContext'
import api from '../../services/api'
import VerificationBadge from '../../components/VerificationBadge'
import { ShieldCheck } from 'lucide-react'

export default function InvestorProfilePage() {
  const { user, updateActiveUser } = useAuthContext()

  const [form, setForm] = useState({
    display_name: user?.full_name || '',
    email: user?.email || '',
    firm: user?.firm || '',
    bio: '',
    cv_filename: '',
    cv_text: '',
  })

  const [preferences, setPreferences] = useState({
    industries: ['CleanTech', 'FinTech', 'AI / DeepTech'],
    stages: ['Seed', 'Series A'],
    check_size_min: 100000,
    check_size_max: 1000000,
    geographies: ['Global', 'North America', 'India'],
    notes: '',
  })

  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [alert, setAlert] = useState(null)

  const investorId = user?.investor_id || 'investor-elena'
  const isVerified = Boolean(user?.is_verified)

  useEffect(() => {
    api
      .getInvestor(investorId)
      .then((data) => {
        if (data) {
          setForm({
            display_name: data.display_name || user?.full_name || '',
            email: data.email || user?.email || '',
            firm: data.firm || '',
            bio: data.bio || '',
            cv_filename: data.cv_filename || '',
            cv_text: data.cv_text || '',
          })
          if (data.preferences) setPreferences((p) => ({ ...p, ...data.preferences }))
          if (data.verification_report) setReport(data.verification_report)
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [investorId, user])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setAlert(null)
    try {
      await api.updateInvestor(investorId, form)
      await api.updateInvestorPreferences(investorId, preferences)
      updateActiveUser({
        full_name: form.display_name,
        firm: form.firm,
      })
      setAlert({ type: 'success', text: 'Profile and investment preferences saved!' })
    } catch (err) {
      setAlert({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const handleLoadSampleCv = () => {
    setForm((prev) => ({
      ...prev,
      cv_filename: 'ELENA_ROSTOVA_PARTNER_CV_2026.pdf',
      cv_text:
        'Managing Partner at Apex Horizon Capital. 10+ years venture investment experience. Early-stage lead investor across 22 startups with 4 exits. FINRA certified accredited investor with high-net-worth institutional syndicate mandate.',
    }))
  }

  const handleRunVerification = async () => {
    if (!form.cv_filename && !form.cv_text) {
      setAlert({ type: 'error', text: 'Please attach or enter your CV details before running verification.' })
      return
    }

    setVerifying(true)
    setAlert(null)
    try {
      // First save current CV details
      await api.updateInvestor(investorId, form)
      // Call AI verification
      const res = await api.verifyInvestor(investorId)
      setReport(res.report)
      updateActiveUser({ is_verified: res.is_verified })
      setAlert({
        type: 'success',
        text: `AI CV Verification complete! Credibility Score: ${res.verification_score}/100 • You are now AI Verified and authorized to negotiate deals!`,
      })
    } catch (err) {
      setAlert({ type: 'error', text: `Verification failed: ${err.message}` })
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5 mb-1.5">
            Investor Accreditation & Profile
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Profile & CV Verification</h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload your Curriculum Vitae (CV) and verify credentials with the AI Verifier agent to unlock Dealroom negotiation and term sheet execution.
          </p>
        </div>

        <VerificationBadge isVerified={isVerified} size="lg" />
      </div>

      {alert && (
        <div
          className={`rounded-xl p-4 text-xs font-semibold flex items-center justify-between shadow-xs ${
            alert.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
              : 'bg-red-50 border border-red-300 text-red-900'
          }`}
        >
          <span>{alert.text}</span>
          <button onClick={() => setAlert(null)} className="font-bold ml-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* Main Grid: Form Left, AI CV Verification Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Left (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveProfile} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5 text-xs">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Personal & Firm Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Syndicate / Venture Firm</label>
                <input
                  type="text"
                  value={form.firm}
                  onChange={(e) => setForm({ ...form, firm: e.target.value })}
                  placeholder="e.g. Apex Horizon Capital"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Investor Bio & Investment Thesis</label>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Describe your track record, preferred stage, and founder philosophy..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* CV Section */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                  <span>📄 Curriculum Vitae (CV) & Accreditation Document</span>
                </h3>
                <button
                  type="button"
                  onClick={handleLoadSampleCv}
                  className="rounded bg-white px-2.5 py-1 text-[11px] font-bold text-amber-900 border border-amber-300 hover:bg-amber-100 transition cursor-pointer"
                >
                  Load Sample Executive CV
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">CV File Attachment Name</label>
                <input
                  type="text"
                  value={form.cv_filename}
                  onChange={(e) => setForm({ ...form, cv_filename: e.target.value })}
                  placeholder="e.g. EXECUTIVE_VENTURE_CV.pdf"
                  className="w-full rounded-lg border border-amber-300 px-3 py-2 text-xs font-mono text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Experience Summary / Credentials Excerpt
                </label>
                <textarea
                  rows={3}
                  value={form.cv_text}
                  onChange={(e) => setForm({ ...form, cv_text: e.target.value })}
                  placeholder="Paste career track record, exits, fund commitments, or accreditation statement..."
                  className="w-full rounded-lg border border-amber-300 px-3 py-2 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono text-[11px]"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleRunVerification}
                  disabled={verifying}
                  className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {verifying ? 'AI Verifying CV...' : '⚡ Run AI CV Verification'}
                </button>
              </div>
            </div>

            {/* Investment Preferences */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <h3 className="font-bold text-slate-900 text-xs">Investment Ticket & Preferences</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Min Check Size ($)</label>
                  <input
                    type="number"
                    value={preferences.check_size_min}
                    onChange={(e) => setPreferences({ ...preferences, check_size_min: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Max Check Size ($)</label>
                  <input
                    type="number"
                    value={preferences.check_size_max}
                    onChange={(e) => setPreferences({ ...preferences, check_size_max: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-[#0f3d2e] hover:bg-[#165540] text-white px-6 py-2.5 text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile & Preferences'}
              </button>
            </div>
          </form>
        </div>

        {/* AI CV Verification Status Card (Right 1 col) */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">AI Credential Verification</h3>
              <VerificationBadge isVerified={isVerified} size="sm" />
            </div>

            {report ? (
              <div className="space-y-4 text-xs">
                <div className="rounded-xl bg-slate-50 p-3.5 flex items-center justify-between border border-slate-100">
                  <span className="text-slate-500 font-semibold text-[11px]">Credibility Rating</span>
                  <span className="text-2xl font-black text-emerald-700">
                    {report.score || 92}/100
                  </span>
                </div>

                <p className="text-slate-600 text-[11px] leading-relaxed">{report.summary}</p>

                {report.badges && report.badges.length > 0 && (
                  <div>
                    <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider block mb-1.5">
                      Earned Badges
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {report.badges.map((b, i) => (
                        <span key={i} className="rounded-full bg-cyan-50 border border-cyan-300 text-cyan-900 text-[10px] font-bold px-2 py-0.5">
                          ✓ {b}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider block">
                    Accreditation Checks
                  </span>
                  {(report.checks || []).map((c, i) => (
                    <div key={i} className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 text-[11px]">{c.check}</span>
                        <span
                          className={`font-black text-[9px] px-1.5 py-0.2 rounded ${
                            c.status === 'PASS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{c.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <ShieldCheck className="h-10 w-10 mx-auto text-slate-400" />
                <p className="font-semibold text-slate-700">Verification Pending</p>
                <p className="text-slate-500">
                  Upload your CV to run AI verification and gain Dealroom access to issue term sheets.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
