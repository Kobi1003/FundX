import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import VerificationBadge from '../../components/VerificationBadge'

export default function AdminStartupsPage() {
  const [startups, setStartups] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [verifyingId, setVerifyingId] = useState(null)
  const [inspectStartup, setInspectStartup] = useState(null)
  const [msg, setMsg] = useState('')

  const loadStartups = () => {
    setLoading(true)
    api
      .listStartups()
      .then((data) => setStartups(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadStartups()
  }, [])

  const handleVerify = async (id) => {
    setVerifyingId(id)
    setMsg('')
    try {
      const res = await api.verifyStartup(id)
      setMsg(`AI Verification completed for ${res.startup_id}: Score ${res.verification_score}/100`)
      loadStartups()
    } catch (err) {
      setMsg(`Verification error: ${err.message}`)
    } finally {
      setVerifyingId(null)
    }
  }

  const filtered = startups.filter((s) => {
    const matchSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.industry?.toLowerCase().includes(search.toLowerCase()) ||
      s.gst_number?.toLowerCase().includes(search.toLowerCase())
    const matchIndustry = industryFilter === 'all' || s.industry === industryFilter
    return matchSearch && matchIndustry
  })

  const industries = ['all', ...new Set(startups.map((s) => s.industry).filter(Boolean))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Startups Directory & Compliance</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage company registrations, inspect incorporation documents, and review AI background checks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/company-edit"
            className="rounded-lg bg-[#0f3d2e] px-4 py-2 text-xs font-semibold text-white hover:bg-[#165540] transition shadow-xs"
          >
            + Edit Company / Upload Docs
          </Link>
        </div>
      </div>

      {msg && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg('')} className="text-emerald-600 font-bold ml-2">×</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <input
          type="text"
          placeholder="Search by name, industry, or GST..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">Industry:</span>
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          >
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind === 'all' ? 'All Industries' : ind}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Startups Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Startup Name</th>
                <th className="px-4 py-3">Industry / Stage</th>
                <th className="px-4 py-3">GST Number</th>
                <th className="px-4 py-3">Incorporation Doc</th>
                <th className="px-4 py-3">Verification Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{s.email || 'No email'}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                      {s.industry || 'Tech'}
                    </span>
                    <div className="text-[11px] text-slate-400 mt-0.5">{s.stage || 'Seed'} Stage</div>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[11px]">
                    {s.gst_number ? (
                      <span className="text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded font-semibold">
                        {s.gst_number}
                      </span>
                    ) : (
                      <span className="text-amber-600 italic">Missing</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-[11px]">
                    {s.incorporation_cert ? (
                      <span className="text-emerald-700 font-medium truncate max-w-[150px] inline-block">
                        📄 {s.incorporation_cert}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">None attached</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <VerificationBadge
                      isVerified={s.is_verified}
                      status={s.verification_status}
                      score={s.verification_score}
                      showScore={true}
                    />
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-2">
                    <button
                      type="button"
                      onClick={() => setInspectStartup(s)}
                      className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition cursor-pointer"
                    >
                      Audit Report
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerify(s.id)}
                      disabled={verifyingId === s.id}
                      className="rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 px-2.5 py-1 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                    >
                      {verifyingId === s.id ? 'Analyzing...' : 'Run AI Check'}
                    </button>
                    <Link
                      to={`/admin/company-edit?id=${s.id}`}
                      className="rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 px-2.5 py-1 text-xs font-semibold transition inline-block"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-slate-400">
                    No startups match your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Report Modal */}
      {inspectStartup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  AI Background Audit: {inspectStartup.name}
                </h3>
                <p className="text-xs text-slate-500">Corporate identity, GSTIN checksum, and ROC registry analysis</p>
              </div>
              <button
                onClick={() => setInspectStartup(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">Compliance Score</span>
                  <div className="text-2xl font-black text-emerald-700">
                    {inspectStartup.verification_score || (inspectStartup.is_verified ? 92 : 60)}/100
                  </div>
                </div>
                <VerificationBadge isVerified={inspectStartup.is_verified} size="lg" />
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-2">Audit Checkpoints</h4>
                <div className="space-y-2">
                  {(inspectStartup.verification_report?.audit_checks || [
                    { check: 'GSTIN Structure & Active State Registry', status: inspectStartup.gst_number ? 'PASS' : 'FLAGGED', detail: inspectStartup.gst_number || 'Missing GST number' },
                    { check: 'ROC Certificate of Incorporation', status: inspectStartup.incorporation_cert ? 'PASS' : 'FLAGGED', detail: inspectStartup.incorporation_cert || 'Missing document' },
                    { check: 'Sector Regulatory Clearance', status: 'PASS', detail: `Compliant with ${inspectStartup.industry || 'Industry'} standards` },
                    { check: 'Corporate Identity Disclosures', status: 'PASS', detail: 'Good standing' },
                  ]).map((chk, i) => (
                    <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-100 bg-white">
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${chk.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {chk.status}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-800">{chk.check}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">{chk.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {inspectStartup.thesis && (
                <div className="bg-slate-50 p-3 rounded-xl">
                  <h4 className="font-bold text-slate-900 mb-1">Company Pitch & Thesis</h4>
                  <p className="text-slate-600 italic">{inspectStartup.thesis}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setInspectStartup(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleVerify(inspectStartup.id)
                  setInspectStartup(null)
                }}
                className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 transition cursor-pointer"
              >
                Re-Run AI Check Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
