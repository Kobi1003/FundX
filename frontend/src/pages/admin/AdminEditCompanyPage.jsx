import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../../services/api'
import VerificationBadge from '../../components/VerificationBadge'

export default function AdminEditCompanyPage() {
  const [searchParams] = useSearchParams()
  const prefillId = searchParams.get('id')

  const [startups, setStartups] = useState([])
  const [selectedId, setSelectedId] = useState(prefillId || '')
  const [form, setForm] = useState({
    name: '',
    tagline: '',
    description: '',
    industry: 'CleanTech',
    stage: 'Seed',
    website: '',
    email: '',
    gst_number: '',
    incorporation_cert: '',
    is_verified: false,
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [auditReport, setAuditReport] = useState(null)
  const [alert, setAlert] = useState(null)

  useEffect(() => {
    api
      .listStartups()
      .then((data) => {
        setStartups(data || [])
        if (data && data.length > 0) {
          const target = prefillId ? data.find((s) => s.id === prefillId) : data[0]
          if (target) {
            setSelectedId(target.id)
            setForm({
              name: target.name || '',
              tagline: target.tagline || '',
              description: target.description || '',
              industry: target.industry || 'CleanTech',
              stage: target.stage || 'Seed',
              website: target.website || '',
              email: target.email || '',
              gst_number: target.gst_number || '',
              incorporation_cert: target.incorporation_cert || '',
              is_verified: Boolean(target.is_verified),
            })
            setAuditReport(target.verification_report || null)
          }
        }
      })
      .catch((err) => setAlert({ type: 'error', text: err.message }))
      .finally(() => setLoading(false))
  }, [prefillId])

  const handleSelectStartup = (id) => {
    setSelectedId(id)
    const target = startups.find((s) => s.id === id)
    if (target) {
      setForm({
        name: target.name || '',
        tagline: target.tagline || '',
        description: target.description || '',
        industry: target.industry || 'CleanTech',
        stage: target.stage || 'Seed',
        website: target.website || '',
        email: target.email || '',
        gst_number: target.gst_number || '',
        incorporation_cert: target.incorporation_cert || '',
        is_verified: Boolean(target.is_verified),
      })
      setAuditReport(target.verification_report || null)
      setAlert(null)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!selectedId) return
    setSaving(true)
    setAlert(null)
    try {
      const updated = await api.updateStartup(selectedId, form)
      setAlert({ type: 'success', text: 'Company details and documents saved successfully!' })
      // Update local array
      setStartups((prev) => prev.map((s) => (s.id === selectedId ? { ...s, ...updated } : s)))
    } catch (err) {
      setAlert({ type: 'error', text: `Failed to save: ${err.message}` })
    } finally {
      setSaving(false)
    }
  }

  const handleReVerify = async () => {
    if (!selectedId) return
    setVerifying(true)
    setAlert(null)
    try {
      // First save current GST and docs
      await api.updateStartup(selectedId, form)
      // Call verification
      const res = await api.verifyStartup(selectedId)
      setAuditReport(res.report)
      setForm((prev) => ({ ...prev, is_verified: res.is_verified }))
      setAlert({
        type: 'success',
        text: `AI Re-verification Complete! Status: ${res.verification_status?.toUpperCase()} • Score: ${res.verification_score}/100`,
      })
      setStartups((prev) =>
        prev.map((s) => (s.id === selectedId ? { ...s, is_verified: res.is_verified, verification_score: res.verification_score } : s))
      )
    } catch (err) {
      setAlert({ type: 'error', text: `Re-verification error: ${err.message}` })
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5 mb-1.5">
            Super Admin Corporate Editor
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Edit Company & Document Re-verification</h1>
          <p className="text-sm text-slate-500 mt-1">
            Update company records, replace GST and Incorporation certificates, and re-run AI compliance verifications.
          </p>
        </div>
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

      {/* Select Company Dropdown */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-auto">
          <label className="block text-xs font-bold text-slate-700 mb-1">Select Company Entity to Edit:</label>
          <select
            value={selectedId}
            onChange={(e) => handleSelectStartup(e.target.value)}
            className="w-full sm:w-96 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500"
          >
            {startups.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.industry}) — {s.is_verified ? '✓ AI Verified' : '⚠️ Pending'}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <VerificationBadge isVerified={form.is_verified} size="lg" />
          <button
            type="button"
            onClick={handleReVerify}
            disabled={verifying}
            className="rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {verifying ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" strokeWidth="3" strokeOpacity="0.3" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="3" />
                </svg>
                <span>Running AI Audit...</span>
              </>
            ) : (
              <>
                <span>⚡ Re-Verify Company with AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Form Left, AI Audit Report Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Edit Form */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4 border-b border-slate-100 pb-2">
            Company Credentials & Corporate Documents
          </h2>

          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Company Legal Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Industry Sector</label>
                <select
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="CleanTech">CleanTech & Renewable Energy</option>
                  <option value="FinTech">FinTech & Payments</option>
                  <option value="HealthTech">HealthTech & BioTech</option>
                  <option value="Robotics">Robotics & Industrial Automation</option>
                  <option value="AI / DeepTech">AI / DeepTech</option>
                  <option value="B2B SaaS">B2B SaaS</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Funding Stage</label>
                <select
                  value={form.stage}
                  onChange={(e) => setForm({ ...form, stage: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Pre-Seed">Pre-Seed</option>
                  <option value="Seed">Seed</option>
                  <option value="Series A">Series A</option>
                  <option value="Series B">Series B</option>
                  <option value="Growth">Growth</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Corporate Website</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://company.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Founder / Contact Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">One-Line Tagline</label>
              <input
                type="text"
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Document Upload & GST Verification Block */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
              <h3 className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                <span>🛡️ Statutory Regulatory Credentials (GST & Incorporation)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">GST Number (GSTIN)</label>
                  <input
                    type="text"
                    value={form.gst_number}
                    onChange={(e) => setForm({ ...form, gst_number: e.target.value })}
                    placeholder="e.g. 27AABCA1234F1Z8"
                    className="w-full rounded-lg border border-amber-300 px-3 py-2 text-xs font-mono font-bold text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none uppercase"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    15-character alphanumeric statutory tax registry identifier
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Incorporation Certificate Document</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.incorporation_cert}
                      onChange={(e) => setForm({ ...form, incorporation_cert: e.target.value })}
                      placeholder="e.g. COMPANY_ROC_CERTIFICATE.pdf"
                      className="w-full rounded-lg border border-amber-300 px-3 py-2 text-xs font-mono text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Upload or replace Registrar of Companies (ROC) filing
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      gst_number: '27AABCA1234F1Z8',
                      incorporation_cert: 'ROC_AUTHENTICATED_CERT_2026.pdf',
                    }))
                  }
                  className="text-[11px] rounded bg-white px-2.5 py-1 font-semibold text-amber-900 border border-amber-300 hover:bg-amber-100 transition cursor-pointer"
                >
                  Apply Valid Test Credentials
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_verified}
                  onChange={(e) => setForm({ ...form, is_verified: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-semibold text-slate-800">Super Admin Manual Verification Override</span>
              </label>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#0f3d2e] hover:bg-[#165540] text-white px-5 py-2.5 text-xs font-bold transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Company Details'}
              </button>
            </div>
          </form>
        </div>

        {/* AI Audit Report Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h3 className="font-bold text-slate-900 text-sm">AI Verification Live Audit</h3>
              <VerificationBadge isVerified={form.is_verified} size="sm" />
            </div>

            {auditReport ? (
              <div className="space-y-3 text-xs">
                <div className="rounded-xl bg-slate-50 p-3 flex items-center justify-between">
                  <span className="text-slate-500 font-semibold text-[11px]">Compliance Confidence</span>
                  <span className="text-xl font-black text-emerald-700">
                    {auditReport.score || 90}/100
                  </span>
                </div>

                <p className="text-slate-600 text-[11px] leading-relaxed">{auditReport.summary}</p>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                    Statutory Checks
                  </span>
                  {(auditReport.audit_checks || []).map((chk, idx) => (
                    <div key={idx} className="p-2 rounded-lg border border-slate-100 bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 text-[11px]">{chk.check}</span>
                        <span
                          className={`font-black text-[9px] px-1.5 py-0.2 rounded ${
                            chk.status === 'PASS'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {chk.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{chk.detail}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 text-xs">
                <p>No audit report generated for this entity yet.</p>
                <p className="mt-1">Click &ldquo;Re-Verify Company with AI&rdquo; to analyze.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
