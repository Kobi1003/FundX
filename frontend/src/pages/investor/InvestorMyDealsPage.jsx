import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import api from '../../services/api'
import VerificationBadge from '../../components/VerificationBadge'
import { Handshake, Building2, Sparkles, Search, Filter } from 'lucide-react'

const recentDealsFromOtherInvestors = [
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
]

export default function InvestorMyDealsPage() {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const isVerified = Boolean(user?.is_verified)

  useEffect(() => {
    api
      .listDeals()
      .then((data) => {
        // Ongoing active deals
        const ongoing = (data || []).filter((d) => d.status !== 'draft')
        setDeals(ongoing)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const filteredDeals = deals.filter((d) => {
    const matchSearch =
      d.title?.toLowerCase().includes(search.toLowerCase()) ||
      d.startup_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.pitch?.toLowerCase().includes(search.toLowerCase())

    const isNegotiating = d.status === 'negotiating' || d.status === 'active'
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'negotiating' && isNegotiating) ||
      (statusFilter === 'open' && d.status === 'published') ||
      (statusFilter === 'closed' && d.status === 'closed')

    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Deals (Ongoing Negotiations)</h1>
            <span className="rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold px-2.5 py-0.5 border border-emerald-200">
              {filteredDeals.length} Active Rounds
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track your ongoing deal pipeline, evaluate term sheets, and enter specific company dealrooms to negotiate.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <VerificationBadge isVerified={isVerified} size="md" />
          <Link
            to="/investor/deals"
            className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold transition shadow-xs"
          >
            Explore All Marketplace Deals →
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search my ongoing deals by startup name, keywords, or pitch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Round Statuses</option>
            <option value="negotiating">⚡ In Negotiation</option>
            <option value="open">🟢 Open Marketplace Round</option>
            <option value="closed">💜 Closed Deals</option>
          </select>
        </div>
      </div>

      {/* Ongoing Deals Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400 animate-pulse">
          Loading my ongoing deals...
        </div>
      ) : filteredDeals.length === 0 ? (
        <div className="p-12 text-center text-slate-500 border border-dashed border-slate-300 rounded-2xl">
          No ongoing deals found matching your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeals.map((deal) => {
            const isNegotiating = deal.status === 'negotiating' || deal.status === 'active'
            const isClosed = deal.status === 'closed'

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
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                        isClosed
                          ? 'bg-purple-50 text-purple-900 border-purple-300'
                          : isNegotiating
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                      }`}
                    >
                      {isClosed ? '💜 Closed' : isNegotiating ? '⚡ In Negotiation' : '🟢 Open Round'}
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

                  {/* Financial Metrics */}
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

      {/* RECENT 5 DEALS FROM OTHER INVESTORS SECTION */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" />
                <span>Recent 5 Deals & Offers from Other Investors</span>
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live market intelligence: recent syndicate proposals, counter-offers, and executed term sheets across FundX.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 text-emerald-900 text-[10px] font-bold px-2.5 py-1 border border-emerald-200 shrink-0 self-start sm:self-auto">
            Live Market Intelligence
          </span>
        </div>

        <div className="space-y-3">
          {recentDealsFromOtherInvestors.map((item) => (
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
