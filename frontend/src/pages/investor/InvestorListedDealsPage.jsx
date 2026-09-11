import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import api from '../../services/api'
import VerificationBadge from '../../components/VerificationBadge'
import { ShieldAlert } from 'lucide-react'

export default function InvestorListedDealsPage() {
  const navigate = useNavigate()
  const { user } = useAuthContext()

  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('all')
  const [minScore, setMinScore] = useState(0)
  const [inspectDeal, setInspectDeal] = useState(null)
  const [showGatingModal, setShowGatingModal] = useState(false)
  const [alert, setAlert] = useState(null)

  const isVerified = Boolean(user?.is_verified)

  useEffect(() => {
    api
      .listDeals()
      .then((data) => {
        // Show published, negotiating, and closed deals (all marketplace deals)
        const marketDeals = (data || []).filter((d) => d.status !== 'draft')
        setDeals(marketDeals)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const handleNegotiateClick = (deal) => {
    if (!isVerified) {
      setShowGatingModal(true)
      return
    }
    navigate(`/investor/dealroom?dealId=${deal.id}`)
  }

  const handleExpressInterest = async (dealId) => {
    try {
      await api.expressInterest(dealId, {
        investor_id: user?.investor_id || 'investor-elena',
        investor_name: user?.full_name || 'Elena Rostova',
      })
      setAlert({ type: 'success', text: 'Interest registered! The startup founder has been notified.' })
    } catch (err) {
      setAlert({ type: 'error', text: err.message })
    }
  }

  const filtered = deals.filter((d) => {
    const matchSearch =
      d.title?.toLowerCase().includes(search.toLowerCase()) ||
      d.pitch?.toLowerCase().includes(search.toLowerCase()) ||
      d.startup_name?.toLowerCase().includes(search.toLowerCase())
    const matchIndustry = industryFilter === 'all' || d.industry === industryFilter
    const matchStage = stageFilter === 'all' || d.funding_stage === stageFilter
    const matchScore = (d.ai_score || 85) >= Number(minScore)
    return matchSearch && matchIndustry && matchStage && matchScore
  })

  const industries = ['all', ...new Set(deals.map((d) => d.industry).filter(Boolean))]
  const stages = ['all', 'Pre-Seed', 'Seed', 'Series A', 'Series B']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Listed Deals Marketplace</h1>
          <p className="text-sm text-slate-500 mt-1">
            Explore verified investment rounds, evaluate AI simulations, and negotiate hybrid equity + royalty term sheets.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <VerificationBadge isVerified={isVerified} size="md" />
          {!isVerified && (
            <Link
              to="/investor/profile"
              className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 text-xs font-bold transition shadow-xs"
            >
              Verify CV to Unlock Negotiations
            </Link>
          )}
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

      {/* Deep Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            placeholder="Search deals by keywords, technology, or startup name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:flex-1 rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind === 'all' ? 'All Industries' : ind}
                </option>
              ))}
            </select>

            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {stages.map((stg) => (
                <option key={stg} value={stg}>
                  {stg === 'all' ? 'All Stages' : stg}
                </option>
              ))}
            </select>

            <select
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="0">Min AI Score: Any</option>
              <option value="75">Min AI Score: 75+</option>
              <option value="85">Min AI Score: 85+ (Tier 1)</option>
              <option value="90">Min AI Score: 90+ (Exceptional)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((deal) => (
          <div
            key={deal.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-bold text-sm text-slate-900">{deal.startup_name}</span>
                  <div className="mt-0.5">
                    <VerificationBadge isVerified={deal.startup_verified} size="sm" />
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    deal.status === 'closed'
                      ? 'bg-purple-100 text-purple-700'
                      : deal.status === 'negotiating'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {deal.status}
                </span>
              </div>

              {/* Pitch */}
              <h3 className="font-bold text-slate-900 text-sm mt-3 line-clamp-2">{deal.title}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{deal.pitch}</p>

              {/* Terms Matrix */}
              <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-xl bg-slate-50 p-2.5 text-center border border-slate-100">
                <div>
                  <span className="text-[9px] font-semibold uppercase text-slate-400">Target</span>
                  <div className="font-bold text-xs text-slate-900">
                    ${(Number(deal.target_raise) || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-[9px] font-semibold uppercase text-slate-400">Equity</span>
                  <div className="font-bold text-xs text-emerald-700">{deal.equity_pct}%</div>
                </div>
                <div>
                  <span className="text-[9px] font-semibold uppercase text-slate-400">Royalty</span>
                  <div className="font-bold text-xs text-amber-700">{deal.royalty_pct || 0}%</div>
                </div>
              </div>

              {/* AI Score & Payout Terms */}
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">AI Feasibility Score:</span>
                  <span className="font-bold text-emerald-700">
                    {deal.ai_score ? `${deal.ai_score}/100` : '88/100'}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2 text-[11px]">
                  <span className="text-slate-400 whitespace-nowrap">Payout Terms:</span>
                  <span className="font-medium text-slate-700 text-right truncate">
                    {deal.royalty_payout_terms || 'Standard'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setInspectDeal(deal)}
                className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 text-xs font-semibold transition cursor-pointer"
              >
                Thesis Details
              </button>

              <button
                type="button"
                onClick={() => handleNegotiateClick(deal)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer ${
                  isVerified
                    ? 'bg-[#0f3d2e] hover:bg-[#165540] text-white'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                }`}
              >
                {isVerified ? 'Negotiate Deal →' : 'Negotiate (Verify CV)'}
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && !loading && (
          <div className="col-span-full p-12 text-center text-slate-400 border border-dashed border-slate-300 rounded-2xl">
            No deals found matching your filters.
          </div>
        )}
      </div>

      {/* Deal Detail Inspection Modal */}
      {inspectDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {inspectDeal.funding_stage} • {inspectDeal.industry}
                </span>
                <h3 className="font-bold text-lg text-slate-900 mt-0.5">{inspectDeal.title}</h3>
              </div>
              <button
                onClick={() => setInspectDeal(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-900 mb-1">One-Line Pitch</h4>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">{inspectDeal.pitch}</p>
              </div>

              {inspectDeal.thesis && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Founder Investment Thesis</h4>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-lg italic leading-relaxed">
                    {inspectDeal.thesis}
                  </p>
                </div>
              )}

              {/* Terms Callout */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Target Raise</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    ${(Number(inspectDeal.target_raise) || 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Equity</span>
                  <div className="font-bold text-emerald-700 text-sm mt-0.5">{inspectDeal.equity_pct}%</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Royalty</span>
                  <div className="font-bold text-amber-700 text-sm mt-0.5">{inspectDeal.royalty_pct || 0}%</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">AI Feasibility</span>
                  <div className="font-bold text-emerald-700 text-sm mt-0.5">
                    {inspectDeal.ai_score ? `${inspectDeal.ai_score}/100` : '88/100'}
                  </div>
                </div>
              </div>

              {/* Simulation Scenarios if available */}
              {inspectDeal.ai_report?.simulation && (
                <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                  <h4 className="font-bold text-slate-900">AI Market Simulation Projections</h4>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="p-2 rounded bg-emerald-50 text-emerald-950 font-medium">
                      <span className="block font-bold">Bull Case</span>
                      ${(inspectDeal.ai_report.simulation.bull.annual_revenue || 0).toLocaleString()}
                    </div>
                    <div className="p-2 rounded bg-slate-100 text-slate-900 font-medium">
                      <span className="block font-bold">Base Case</span>
                      ${(inspectDeal.ai_report.simulation.base.annual_revenue || 0).toLocaleString()}
                    </div>
                    <div className="p-2 rounded bg-amber-50 text-amber-950 font-medium">
                      <span className="block font-bold">Bear Case</span>
                      ${(inspectDeal.ai_report.simulation.bear.annual_revenue || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between items-center pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleExpressInterest(inspectDeal.id)}
                className="rounded-lg border border-slate-300 bg-white hover:bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                Express Interest
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setInspectDeal(null)}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInspectDeal(null)
                    handleNegotiateClick(inspectDeal)
                  }}
                  className="rounded-lg bg-[#0f3d2e] hover:bg-[#165540] text-white px-5 py-2 text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Enter Dealroom to Negotiate →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Gating Modal */}
      {showGatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-amber-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 font-black">
                <ShieldAlert className="h-6 w-6 text-amber-900" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Verification Requirement</h3>
                <p className="text-xs text-amber-800 font-semibold">AI CV Accreditation Mandatory</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              To enter the Dealroom, submit binding term sheets, or negotiate deal terms, platform security requires that you upload your Curriculum Vitae (CV) and obtain the <span className="font-bold text-emerald-700">AI Verified Investor</span> badge.
            </p>

            <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowGatingModal(false)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowGatingModal(false)
                  navigate('/investor/profile')
                }}
                className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2 text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Upload CV & Verify Now →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
