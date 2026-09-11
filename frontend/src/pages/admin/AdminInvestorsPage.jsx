import { useEffect, useState } from 'react'
import api from '../../services/api'
import VerificationBadge from '../../components/VerificationBadge'

export default function AdminInvestorsPage() {
  const [investors, setInvestors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [verifyingId, setVerifyingId] = useState(null)
  const [inspectInvestor, setInspectInvestor] = useState(null)
  const [msg, setMsg] = useState('')

  const loadInvestors = () => {
    setLoading(true)
    api
      .listInvestors()
      .then((data) => setInvestors(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadInvestors()
  }, [])

  const handleVerify = async (id) => {
    setVerifyingId(id)
    setMsg('')
    try {
      const res = await api.verifyInvestor(id)
      setMsg(`AI Verification completed for ${res.investor_id}: Score ${res.verification_score}/100`)
      loadInvestors()
    } catch (err) {
      setMsg(`Verification error: ${err.message}`)
    } finally {
      setVerifyingId(null)
    }
  }

  const filtered = investors.filter(
    (inv) =>
      inv.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.firm?.toLowerCase().includes(search.toLowerCase()) ||
      inv.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Investors Directory & Accreditation</h1>
          <p className="text-sm text-slate-500 mt-1">
            Supervise angel and syndicate profiles, inspect uploaded CVs, and manage Dealroom negotiation authorization.
          </p>
        </div>
      </div>

      {msg && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="text-emerald-600 font-bold ml-2">×</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <input
          type="text"
          placeholder="Search by investor name, syndicate, or firm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Investor / Lead</th>
                <th className="px-4 py-3">Firm / Syndicate</th>
                <th className="px-4 py-3">Curriculum Vitae (CV)</th>
                <th className="px-4 py-3">Accreditation Status</th>
                <th className="px-4 py-3">Dealroom Rights</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900 text-sm">{inv.display_name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{inv.email || 'No email'}</div>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-800">
                    {inv.firm || 'Independent Angel'}
                  </td>
                  <td className="px-4 py-3.5">
                    {inv.cv_filename ? (
                      <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                        📄 {inv.cv_filename}
                      </span>
                    ) : (
                      <span className="text-amber-600 font-medium inline-flex items-center gap-1">
                        ⚠️ No CV Uploaded
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <VerificationBadge
                      isVerified={inv.is_verified}
                      status={inv.verification_status}
                      score={inv.verification_score}
                      showScore={true}
                    />
                  </td>
                  <td className="px-4 py-3.5">
                    {inv.is_verified ? (
                      <span className="rounded-full bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 text-[10px]">
                        Authorized to Negotiate
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 text-slate-600 font-medium px-2 py-0.5 text-[10px]">
                        Gated (CV Required)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => setInspectInvestor(inv)}
                      className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition cursor-pointer"
                    >
                      Inspect CV
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerify(inv.id)}
                      disabled={verifyingId === inv.id}
                      className="rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 px-2.5 py-1 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      {verifyingId === inv.id ? 'Analyzing...' : 'AI Verify CV'}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-slate-400">
                    No investors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect CV Modal */}
      {inspectInvestor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Investor Credentials: {inspectInvestor.display_name}
                </h3>
                <p className="text-xs text-slate-500">{inspectInvestor.firm || 'Angel Investor'}</p>
              </div>
              <button
                onClick={() => setInspectInvestor(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    Credibility Rating
                  </span>
                  <div className="text-2xl font-black text-emerald-700">
                    {inspectInvestor.verification_score || (inspectInvestor.is_verified ? 90 : 45)}/100
                  </div>
                </div>
                <VerificationBadge isVerified={inspectInvestor.is_verified} size="lg" />
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Curriculum Vitae Document</h4>
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span className="font-mono text-slate-800">
                    📄 {inspectInvestor.cv_filename || 'No CV file attached yet'}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    {inspectInvestor.cv_filename ? 'PDF Document' : 'Status: Gated'}
                  </span>
                </div>
              </div>

              {inspectInvestor.cv_text && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">CV Excerpt / Experience</h4>
                  <p className="text-slate-600 bg-slate-50 p-3 rounded-lg font-mono text-[11px]">
                    {inspectInvestor.cv_text}
                  </p>
                </div>
              )}

              {inspectInvestor.bio && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Bio</h4>
                  <p className="text-slate-600">{inspectInvestor.bio}</p>
                </div>
              )}

              {inspectInvestor.preferences && (
                <div className="bg-slate-50 p-3 rounded-xl">
                  <h4 className="font-bold text-slate-900 mb-2">Investment Preferences</h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400">Target Industries:</span>
                      <div className="font-semibold text-slate-800 mt-0.5">
                        {(inspectInvestor.preferences.industries || []).join(', ') || 'General Tech'}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">Check Size Range:</span>
                      <div className="font-semibold text-slate-800 mt-0.5">
                        ${((inspectInvestor.preferences.check_size_min || 50000) / 1000).toFixed(0)}k - $
                        {((inspectInvestor.preferences.check_size_max || 500000) / 1000).toFixed(0)}k
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setInspectInvestor(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleVerify(inspectInvestor.id)
                  setInspectInvestor(null)
                }}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition cursor-pointer"
              >
                Run AI CV Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
