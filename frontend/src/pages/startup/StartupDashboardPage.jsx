import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import api from '../../services/api'
import VerificationBadge from '../../components/VerificationBadge'

export default function StartupDashboardPage() {
  const { user } = useAuthContext()
  const [startup, setStartup] = useState(null)
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)

  const startupId = user?.startup_id || 'startup-aerogrid'

  useEffect(() => {
    Promise.allSettled([api.getStartup(startupId), api.listDeals()]).then(
      ([sRes, dRes]) => {
        if (sRes.status === 'fulfilled') setStartup(sRes.value)
        if (dRes.status === 'fulfilled') {
          const allDeals = dRes.value || []
          setDeals(allDeals.filter((d) => d.startup_id === startupId))
        }
        setLoading(false)
      }
    )
  }, [startupId])

  const publishedDeals = deals.filter((d) => d.status === 'published' || d.status === 'negotiating')
  const closedDeals = deals.filter((d) => d.status === 'closed')
  const draftDeals = deals.filter((d) => d.status === 'draft')
  const isVerified = Boolean(startup?.is_verified || user?.is_verified)

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0f3d2e] via-[#14523e] to-[#1c6e54] p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-xs font-semibold text-emerald-200 border border-emerald-400/30">
              🚀 Founder Portal
            </span>
            <VerificationBadge isVerified={isVerified} size="md" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {startup?.name || user?.startup_name || 'Founder Dashboard'}
          </h1>
          <p className="mt-2 text-sm text-emerald-100/90 leading-relaxed">
            {startup?.tagline ||
              'Manage your investment deals, monitor investor offer negotiations, and run AI background verification checks.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/startup/deals/create"
              className="rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-300 transition shadow-sm"
            >
              + Create New Deal (with AI Thesis Check)
            </Link>
            <Link
              to="/startup/dealroom"
              className="rounded-xl bg-white/10 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/20 transition border border-white/20"
            >
              Open Dealroom ({publishedDeals.length + closedDeals.length})
            </Link>
            {!isVerified && (
              <Link
                to="/startup/verifier"
                className="rounded-xl bg-emerald-500 px-4 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition"
              >
                Run AI Verifier Now ⚡
              </Link>
            )}
          </div>
        </div>

        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Verification Warning if unverified */}
      {!isVerified && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-200 text-amber-900 font-bold text-lg">
              ⚠️
            </div>
            <div>
              <h3 className="font-bold text-sm text-amber-950">Company Verification Recommended</h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Verify your GST registration and incorporation documents with the AI Verifier agent to display the verified trust badge on your deals.
              </p>
            </div>
          </div>
          <Link
            to="/startup/verifier"
            className="whitespace-nowrap rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 text-xs font-bold transition shadow-xs"
          >
            Verify Company Background →
          </Link>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Published Deals</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{publishedDeals.length}</span>
            <span className="text-xs text-slate-500">live in marketplace</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">{draftDeals.length} draft deal in progress</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Dealroom Negotiations</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-700">
              {deals.filter((d) => d.status === 'negotiating').length}
            </span>
            <span className="text-xs text-slate-500">active discussions</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Investor offers received</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Closed Investments</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-700">{closedDeals.length}</span>
            <span className="text-xs text-slate-500">funded rounds</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Legally executed term sheets</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Background Status</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700">
              {startup?.verification_score || (isVerified ? 94 : 60)}/100
            </span>
          </div>
          <div className="mt-2">
            <VerificationBadge isVerified={isVerified} size="sm" />
          </div>
        </div>
      </div>

      {/* Deals Overview Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Your Company Investment Deals</h2>
            <p className="text-xs text-slate-500">Track drafts, marketplace listed rounds, and ongoing negotiations</p>
          </div>
          <Link
            to="/startup/deals/create"
            className="rounded-lg bg-[#0f3d2e] hover:bg-[#165540] text-white px-3.5 py-1.5 text-xs font-semibold transition shadow-xs"
          >
            + Create New Deal
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {deals.map((deal) => (
            <div
              key={deal.id}
              className="rounded-xl border border-slate-200 p-4 hover:border-emerald-300 transition flex flex-col justify-between bg-slate-50/40"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {deal.funding_stage || 'Seed'} Stage
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      deal.status === 'closed'
                        ? 'bg-purple-100 text-purple-700'
                        : deal.status === 'negotiating'
                        ? 'bg-amber-100 text-amber-800'
                        : deal.status === 'published'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {deal.status?.toUpperCase()}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">{deal.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{deal.pitch}</p>

                <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-lg bg-white p-2.5 text-center border border-slate-100">
                  <div>
                    <span className="text-[9px] font-semibold uppercase text-slate-400">Raise</span>
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

                {deal.ai_score && (
                  <div className="mt-2 text-xs flex items-center justify-between text-slate-600">
                    <span>AI Feasibility Score:</span>
                    <span className="font-bold text-emerald-700">{deal.ai_score}/100</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {deal.status === 'draft' ? 'Not yet listed' : 'Live Dealroom'}
                </span>
                <Link
                  to="/startup/dealroom"
                  className="rounded-lg bg-[#0f3d2e] hover:bg-[#165540] text-white px-3 py-1.5 text-xs font-semibold transition cursor-pointer"
                >
                  Manage in Dealroom →
                </Link>
              </div>
            </div>
          ))}

          {deals.length === 0 && !loading && (
            <div className="col-span-full p-8 text-center text-slate-400 border border-dashed border-slate-300 rounded-xl">
              <p>You have not created any deals yet.</p>
              <Link
                to="/startup/deals/create"
                className="mt-2 inline-block text-xs font-bold text-emerald-700 hover:underline"
              >
                Create your first deal with AI thesis analysis →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
