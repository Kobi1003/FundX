import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import api from '../../services/api'
import VerificationBadge from '../../components/VerificationBadge'

export default function InvestorDashboardPage() {
  const { user } = useAuthContext()
  const [deals, setDeals] = useState([])
  const [investor, setInvestor] = useState(null)
  const [loading, setLoading] = useState(true)

  const investorId = user?.investor_id || 'investor-elena'
  const isVerified = Boolean(user?.is_verified)

  useEffect(() => {
    Promise.allSettled([api.getInvestor(investorId), api.listDeals()]).then(
      ([iRes, dRes]) => {
        if (iRes.status === 'fulfilled') setInvestor(iRes.value)
        if (dRes.status === 'fulfilled') setDeals(dRes.value || [])
        setLoading(false)
      }
    )
  }, [investorId])

  const publishedDeals = deals.filter((d) => d.status === 'published' || d.status === 'negotiating')
  const closedDeals = deals.filter((d) => d.status === 'closed')

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-[#0a231b] to-slate-900 p-6 sm:p-8 text-white shadow-lg relative overflow-hidden border border-emerald-900/40">
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="rounded-full bg-cyan-400/20 px-3 py-1 text-xs font-semibold text-cyan-200 border border-cyan-400/30">
              💼 Investor Syndicate Portal
            </span>
            <VerificationBadge isVerified={isVerified} size="md" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {investor?.display_name || user?.full_name || 'Investor Dashboard'}
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            {investor?.firm ? `${investor.firm} • ` : ''}
            Access vetted startup deals, review AI feasibility reports with bull/bear simulations, and negotiate hybrid equity + royalty term sheets.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/investor/deals"
              className="rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-300 transition shadow-sm"
            >
              Browse Listed Deals ({publishedDeals.length})
            </Link>
            <Link
              to="/investor/dealroom"
              className="rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition border border-white/20"
            >
              Negotiation Dealroom
            </Link>
            <Link
              to="/investor/profile"
              className="rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
            >
              {isVerified ? 'Edit Profile & CV' : '⚡ Upload CV & Verify'}
            </Link>
          </div>
        </div>

        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Verification Alert Callout if unverified */}
      {!isVerified && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-950 font-black text-xl">
              ⚠️
            </div>
            <div>
              <h3 className="font-bold text-sm text-amber-950">Accredited CV Verification Required</h3>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                To negotiate deals, make offers, or countersign term sheets in the Dealroom, you must upload your CV and receive AI Accredited Verification.
              </p>
            </div>
          </div>
          <Link
            to="/investor/profile"
            className="whitespace-nowrap rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2.5 text-xs font-bold transition shadow-xs"
          >
            Upload CV & Verify Now →
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Available Deals</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{publishedDeals.length}</span>
            <span className="text-xs text-slate-500">open rounds</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Across CleanTech, FinTech & AI</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Negotiations</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-700">
              {deals.filter((d) => d.status === 'negotiating').length}
            </span>
            <span className="text-xs text-slate-500">in dealroom</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Term sheet discussions</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Closed Portfolio</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-700">{closedDeals.length}</span>
            <span className="text-xs text-slate-500">investments funded</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Legally executed contracts</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Accreditation Status</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">
              {isVerified ? 'AI Verified' : 'Unverified'}
            </span>
          </div>
          <div className="mt-2">
            <VerificationBadge isVerified={isVerified} size="sm" />
          </div>
        </div>
      </div>

      {/* Recommended Deals Showcase */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Featured High-Feasibility Deals</h2>
            <p className="text-xs text-slate-500">Curated opportunities matching institutional and angel parameters</p>
          </div>
          <Link to="/investor/deals" className="text-xs font-semibold text-emerald-700 hover:underline">
            Explore All Deals ({publishedDeals.length}) →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {publishedDeals.slice(0, 3).map((deal) => (
            <div
              key={deal.id}
              className="rounded-xl border border-slate-200 p-5 hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between bg-slate-50/40"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {deal.funding_stage || 'Seed'} • {deal.industry}
                  </span>
                  <VerificationBadge isVerified={deal.startup_verified} size="sm" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{deal.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{deal.pitch}</p>

                <div className="mt-4 grid grid-cols-3 gap-1.5 rounded-lg bg-white p-2.5 text-center border border-slate-100">
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

                <div className="mt-3 text-xs flex items-center justify-between text-slate-600">
                  <span>AI Feasibility Score:</span>
                  <span className="font-bold text-emerald-700">
                    {deal.ai_score ? `${deal.ai_score}/100` : '88/100'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 truncate max-w-[120px]">
                  {deal.startup_name}
                </span>
                <Link
                  to={`/investor/deals`}
                  className="rounded-lg bg-[#0f3d2e] hover:bg-[#165540] text-white px-3 py-1.5 text-xs font-semibold transition"
                >
                  Review Deal →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
