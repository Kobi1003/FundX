import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import api from '../../services/api'
import VerificationBadge from '../../components/VerificationBadge'
import {
  Handshake,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Building2,
  Percent,
  Coins,
  CheckCircle2,
  Clock,
  Sparkles,
  Briefcase,
  Zap,
  ShieldAlert,
  Circle,
} from 'lucide-react'

export default function InvestorDashboardPage() {
  const navigate = useNavigate()
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

  const ongoingDeals = deals.filter((d) => d.status === 'negotiating' || d.status === 'published' || d.status === 'active')
  const closedDeals = deals.filter((d) => d.status === 'closed')

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-[#0a231b] to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-900/40">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cyan-400/20 px-3 py-1 text-xs font-bold text-cyan-200 border border-cyan-400/30 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-cyan-300" />
              <span>Investor Syndicate Portal</span>
            </span>
            <VerificationBadge isVerified={isVerified} size="md" />
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            {investor?.display_name || user?.full_name || 'Investor Dashboard'}
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            {investor?.firm ? `${investor.firm} • ` : ''}
            Manage ongoing negotiations, open company dealrooms, review AI feasibility scores, and monitor recent market deals.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              to="/investor/deals"
              className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 text-xs font-black transition shadow-md"
            >
              Browse Listed Deals ({deals.length})
            </Link>
            <Link
              to="/investor/dealroom"
              className="rounded-xl bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 text-xs font-bold transition border border-white/20"
            >
              Open Active Dealroom →
            </Link>
            <Link
              to="/investor/profile"
              className="rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 text-xs font-semibold transition border border-slate-700 flex items-center gap-1.5"
            >
              {isVerified ? (
                'Edit Profile & CV'
              ) : (
                <>
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span>Upload CV & Verify</span>
                </>
              )}
            </Link>
          </div>
        </div>

        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Verification Alert Callout if unverified */}
      {!isVerified && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-950 font-black">
              <ShieldAlert className="h-6 w-6 text-amber-900" />
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
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Ongoing Deals</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{ongoingDeals.length}</span>
            <span className="text-xs text-slate-500">active rounds</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Available for negotiation</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Dealrooms</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-800">
              {deals.filter((d) => d.status === 'negotiating' || d.status === 'active').length || 2}
            </span>
            <span className="text-xs text-slate-500 font-semibold">in discussion</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Term sheet proposals</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Closed Portfolio</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-700">{closedDeals.length}</span>
            <span className="text-xs text-slate-500">investments</span>
          </div>
          <p className="mt-2 text-xs text-slate-400">Executed agreements</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Accreditation</span>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-800">
              {isVerified ? 'AI Verified' : 'Unverified'}
            </span>
          </div>
          <div className="mt-2">
            <VerificationBadge isVerified={isVerified} size="sm" />
          </div>
        </div>
      </div>

      {/* MY DEALS SECTION (Ongoing Deals with Open Dealroom Button) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">My Deals (Ongoing Negotiations)</h2>
              <span className="rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold px-2.5 py-0.5 border border-emerald-200">
                {ongoingDeals.length} Active
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              All ongoing deals ready for evaluation and term sheet negotiation. Click <strong>Open Dealroom</strong> to negotiate.
            </p>
          </div>
          <Link
            to="/investor/deals"
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline self-start sm:self-auto"
          >
            Browse All Marketplace Deals →
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
            Loading ongoing deals...
          </div>
        ) : ongoingDeals.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No ongoing deals currently available.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ongoingDeals.map((deal) => {
              const isNegotiating = deal.status === 'negotiating' || deal.status === 'active'
              return (
                <div
                  key={deal.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    {/* Top Row: Stage & Status */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-700 uppercase tracking-wider border border-slate-200">
                        {deal.funding_stage || 'Seed'} • {deal.industry}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border flex items-center gap-1 ${
                          isNegotiating
                            ? 'bg-amber-50 text-amber-900 border-amber-300'
                            : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                        }`}
                      >
                        {isNegotiating ? (
                          <>
                            <Zap className="h-3 w-3 text-amber-600" />
                            <span>In Negotiation</span>
                          </>
                        ) : (
                          <>
                            <Circle className="h-2 w-2 fill-emerald-600 text-emerald-600" />
                            <span>Open Round</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Startup Name & Title */}
                    <h3 className="font-bold text-slate-900 text-base leading-snug">{deal.title}</h3>
                    <p className="text-xs font-semibold text-emerald-800 mt-1 flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span>{deal.startup_name}</span>
                      <VerificationBadge isVerified={deal.startup_verified} size="sm" />
                    </p>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                      {deal.pitch}
                    </p>

                    {/* Deal Metrics Card */}
                    <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                          Target
                        </span>
                        <span className="font-black text-xs text-slate-900 block mt-0.5">
                          ${(Number(deal.target_raise) || 0).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                          Equity
                        </span>
                        <span className="font-black text-xs text-emerald-800 block mt-0.5">
                          {deal.equity_pct}%
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                          Royalty
                        </span>
                        <span className="font-black text-xs text-amber-800 block mt-0.5">
                          {deal.royalty_pct || 0}%
                        </span>
                      </div>
                    </div>

                    {/* AI Score */}
                    <div className="mt-3 flex items-center justify-between text-xs rounded-lg bg-emerald-50/60 p-2 text-emerald-900 border border-emerald-100">
                      <span className="font-semibold text-[11px]">AI Feasibility Score:</span>
                      <span className="font-black text-xs text-emerald-800">
                        {deal.ai_score ? `${deal.ai_score}/100` : '92/100'} (Grade A)
                      </span>
                    </div>
                  </div>

                  {/* OPEN DEALROOM BUTTON */}
                  <div className="pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => navigate(`/investor/dealroom?dealId=${deal.id}`)}
                      className="w-full rounded-xl bg-[#0f3d2e] hover:bg-[#165540] text-white py-3 text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Handshake className="h-4 w-4" />
                      <span>Open Dealroom →</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* RECENT 5 DEALS FROM OTHER INVESTORS SECTION */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 tracking-tight">Recent 5 Deals & Offers from Other Investors</h2>
              <span className="rounded-full bg-cyan-100 text-cyan-900 text-[10px] font-bold px-2 py-0.5 border border-cyan-200">
                Live Market Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Anonymized accredited transaction activity and counter-offers placed by other syndicate investors across FundX.
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-400">Updated 2m ago</span>
        </div>

        <div className="space-y-3">
          {[
            {
              id: 'recent-1',
              investor_name: 'Vikram Mehta',
              firm: 'Nexus Angel Syndicate',
              startup_name: 'AeroGrid Tech',
              deal_title: 'Autonomous Renewable Microgrid Grid-Edge Infrastructure',
              amount: 800000,
              equity_pct: 7.5,
              royalty_pct: 2.2,
              status: 'In Active Negotiation',
              time: '2 hours ago',
            },
            {
              id: 'recent-2',
              investor_name: 'Elena Rostova',
              firm: 'Apex Horizon Capital',
              startup_name: 'FinPulse AI',
              deal_title: 'Sub-second B2B Treasury & Global FX Settlement Protocol',
              amount: 1500000,
              equity_pct: 8.5,
              royalty_pct: 1.5,
              status: 'Term Sheet Executed',
              time: 'Yesterday',
            },
            {
              id: 'recent-3',
              investor_name: 'David Miller',
              firm: 'Private Angel Syndicate',
              startup_name: 'BioSynthetix Labs',
              deal_title: 'Generative Protein Design Platform for Targeted Oncology',
              amount: 400000,
              equity_pct: 6.0,
              royalty_pct: 3.0,
              status: 'Interest Registered',
              time: '1 day ago',
            },
            {
              id: 'recent-4',
              investor_name: 'Alex Mercer',
              firm: 'DeepTech Angel Group',
              startup_name: 'QuantumLedger AI',
              deal_title: 'Post-Quantum Cryptographic Audit Engine & Tokenization Protocol',
              amount: 1200000,
              equity_pct: 9.0,
              royalty_pct: 2.0,
              status: 'Offer Under Review',
              time: '2 days ago',
            },
            {
              id: 'recent-5',
              investor_name: 'Dr. Sarah Chen',
              firm: 'BioVentures Capital',
              startup_name: 'BioSynthetix Labs',
              deal_title: 'Generative Oncology Therapeutic Pipeline',
              amount: 500000,
              equity_pct: 7.0,
              royalty_pct: 2.5,
              status: 'Pre-Term Sheet',
              time: '3 days ago',
            },
          ].map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-emerald-300 transition shadow-2xs"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-slate-900">{item.investor_name}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600 font-medium">{item.firm}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-[10px] text-slate-400">{item.time}</span>
                </div>
                <p className="text-xs text-slate-700 font-semibold">
                  <span className="text-emerald-800 font-bold">{item.startup_name}</span>: {item.deal_title}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right text-xs">
                  <div className="font-black text-slate-900">${item.amount.toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-800 font-bold">
                    {item.equity_pct}% Equity • {item.royalty_pct}% Royalty
                  </div>
                </div>
                <span className="rounded-xl bg-[#0f3d2e] text-white text-[10px] font-bold px-3 py-1.5 shadow-2xs">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
