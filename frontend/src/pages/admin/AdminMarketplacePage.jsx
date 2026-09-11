import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import VerificationBadge from '../../components/VerificationBadge'

export default function AdminMarketplacePage() {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [inspectDeal, setInspectDeal] = useState(null)
  const [treeData, setTreeData] = useState(null)

  const loadDeals = () => {
    setLoading(true)
    api
      .listDeals()
      .then((data) => setDeals(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadDeals()
  }, [])

  const openInspection = async (deal) => {
    setInspectDeal(deal)
    try {
      const tree = await api.getNegotiationTree(deal.id)
      setTreeData(tree)
    } catch {
      setTreeData(null)
    }
  }

  const filtered = deals.filter((d) => {
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    const matchIndustry = industryFilter === 'all' || d.industry === industryFilter
    return matchStatus && matchIndustry
  })

  const industries = ['all', ...new Set(deals.map((d) => d.industry).filter(Boolean))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5 mb-1.5">
            Omni-Marketplace Supervision
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Platform Deal Marketplace</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time aggregate oversight of all draft, published, ongoing negotiation, and closed investment deals across all startups and investors.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        {/* Status Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { key: 'all', label: 'All Deals' },
            { key: 'published', label: 'Open / Published' },
            { key: 'negotiating', label: 'Under Negotiation' },
            { key: 'closed', label: 'Closed / Funded' },
            { key: 'draft', label: 'Drafts' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-[#0f3d2e] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Industry Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Sector:</span>
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {industries.map((ind) => (
              <option key={ind} value={ind}>
                {ind === 'all' ? 'All Sectors' : ind}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Deals Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((deal) => (
          <div
            key={deal.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              {/* Card Top: Startup Name & Status Badge */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-bold text-sm text-slate-900">{deal.startup_name || 'Startup'}</span>
                  <div className="mt-0.5">
                    <VerificationBadge isVerified={deal.startup_verified} size="sm" />
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                    deal.status === 'closed'
                      ? 'bg-purple-100 text-purple-700 border border-purple-300'
                      : deal.status === 'negotiating'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : deal.status === 'published'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border border-slate-300'
                  }`}
                >
                  {deal.status}
                </span>
              </div>

              {/* Pitch */}
              <h3 className="font-bold text-slate-900 text-base mt-3 line-clamp-2">
                {deal.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{deal.pitch}</p>

              {/* Terms Matrix */}
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center border border-slate-100">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Target</span>
                  <div className="font-bold text-xs text-slate-900">
                    ${(Number(deal.target_raise) || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Equity</span>
                  <div className="font-bold text-xs text-emerald-700">{deal.equity_pct}%</div>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Royalty</span>
                  <div className="font-bold text-xs text-amber-700">{deal.royalty_pct || 0}%</div>
                </div>
              </div>

              {/* AI Feasibility & Payout */}
              <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">AI Feasibility:</span>
                  <span className="font-bold text-emerald-700">
                    {deal.ai_score ? `${deal.ai_score}/100` : 'Analyzed (High)'}
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

            {/* Bottom Actions */}
            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {deal.funding_stage || 'Seed'} • {deal.industry || 'Tech'}
              </span>
              <button
                type="button"
                onClick={() => openInspection(deal)}
                className="rounded-lg bg-[#0f3d2e] hover:bg-[#165540] text-white px-3 py-1.5 text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                Inspect Deal & Tree →
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && !loading && (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
            No deals found matching the selected filters.
          </div>
        )}
      </div>

      {/* Inspect Deal Modal */}
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
              {/* Pitch */}
              <div>
                <h4 className="font-bold text-slate-900 mb-1">One-Line Pitch</h4>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">{inspectDeal.pitch}</p>
              </div>

              {/* Agreed / Closed Terms Callout if closed */}
              {inspectDeal.status === 'closed' && inspectDeal.closed_terms && (
                <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-4">
                  <div className="flex items-center gap-2 font-bold text-purple-900 text-sm mb-2">
                    <span>🎉 Deal Closed & Funded</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-purple-600 text-[10px] font-semibold">Lead Investor</span>
                      <div className="font-bold text-slate-900 mt-0.5">
                        {inspectDeal.closed_terms.investor_name}
                      </div>
                    </div>
                    <div>
                      <span className="text-purple-600 text-[10px] font-semibold">Final Amount</span>
                      <div className="font-bold text-slate-900 mt-0.5">
                        ${(Number(inspectDeal.closed_terms.final_amount) || 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-purple-600 text-[10px] font-semibold">Equity Granted</span>
                      <div className="font-bold text-emerald-800 mt-0.5">
                        {inspectDeal.closed_terms.final_equity_pct}%
                      </div>
                    </div>
                    <div>
                      <span className="text-purple-600 text-[10px] font-semibold">Royalty terms</span>
                      <div className="font-bold text-amber-800 mt-0.5">
                        {inspectDeal.closed_terms.final_royalty_pct}% ({inspectDeal.closed_terms.royalty_payout_terms || 'Capped'})
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dealroom Negotiation Tree */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2">
                  Negotiation Tree & Offers History ({treeData?.timeline?.length || 0} Events)
                </h4>
                <div className="space-y-2.5">
                  {(treeData?.timeline || []).map((step, idx) => (
                    <div
                      key={step.id || idx}
                      className={`p-3 rounded-xl border ${
                        step.status === 'accepted'
                          ? 'border-emerald-300 bg-emerald-50/50'
                          : step.status === 'active'
                          ? 'border-amber-300 bg-amber-50/40'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-bold text-slate-900">
                          {step.sender_type === 'startup' ? '🚀' : '💼'} {step.sender_name}
                        </span>
                        <span
                          className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                            step.status === 'accepted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : step.status === 'active'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {step.status?.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-semibold text-slate-800">
                        <span>Amount: ${(Number(step.amount) || 0).toLocaleString()}</span>
                        <span>Equity: {step.equity_pct}%</span>
                        <span>Royalty: {step.royalty_pct}%</span>
                      </div>
                      <p className="text-slate-600 mt-1 italic text-[11px]">{step.message}</p>
                    </div>
                  ))}
                  {(!treeData?.timeline || treeData.timeline.length === 0) && (
                    <p className="text-slate-400 italic">No negotiation offers recorded yet.</p>
                  )}
                </div>
              </div>

              {/* AI Thesis Analysis & Simulation */}
              {inspectDeal.ai_report && (
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-900">AI Market Simulation & Analysis</h4>
                    <span className="font-bold text-emerald-700">
                      Feasibility: {inspectDeal.ai_report.feasibility_score}/100
                    </span>
                  </div>
                  <p className="text-slate-600 mb-2">{inspectDeal.ai_report.summary}</p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setInspectDeal(null)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
