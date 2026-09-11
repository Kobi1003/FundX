import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import VerificationBadge from '../../components/VerificationBadge'

export default function AdminDashboardPage() {
  const [startups, setStartups] = useState([])
  const [investors, setInvestors] = useState([])
  const [deals, setDeals] = useState([])
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      api.listStartups(),
      api.listInvestors(),
      api.listDeals(),
      api.health(),
    ]).then(([sRes, iRes, dRes, hRes]) => {
      if (sRes.status === 'fulfilled') setStartups(sRes.value || [])
      if (iRes.status === 'fulfilled') setInvestors(iRes.value || [])
      if (dRes.status === 'fulfilled') setDeals(dRes.value || [])
      if (hRes.status === 'fulfilled') setHealth(hRes.value || null)
      setLoading(false)
    })
  }, [])

  const verifiedStartups = startups.filter((s) => s.is_verified)
  const verifiedInvestors = investors.filter((i) => i.is_verified)
  const openDeals = deals.filter((d) => d.status === 'published' || d.status === 'negotiating')
  const closedDeals = deals.filter((d) => d.status === 'closed')
  const totalVolume = deals.reduce((acc, d) => acc + (Number(d.target_raise) || 0), 0)

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0b261e] via-[#0f3d2e] to-[#154e3b] p-6 sm:p-8 text-white shadow-lg border border-emerald-900/40 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300 border border-emerald-500/30 mb-3">
            👑 Super Admin Master Command
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Platform Governance & Marketplace Supervision
          </h1>
          <p className="mt-2 text-sm text-emerald-100/80 leading-relaxed">
            Oversee startup compliance audits, investor accredited status verification, live dealroom negotiation trees, and multi-asset marketplace liquidity across all platform participants.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              to="/admin/marketplace"
              className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 transition shadow-sm"
            >
              Open Deal Marketplace ({deals.length} Deals)
            </Link>
            <Link
              to="/admin/company-edit"
              className="rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition border border-white/20"
            >
              Edit & Re-verify Company
            </Link>
          </div>
        </div>

        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Startups</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {verifiedStartups.length} Verified
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{startups.length}</span>
            <span className="text-xs text-slate-500">total registered</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-1.5 rounded-full"
              style={{ width: `${startups.length ? (verifiedStartups.length / startups.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Investors</span>
            <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">
              {verifiedInvestors.length} Verified
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{investors.length}</span>
            <span className="text-xs text-slate-500">total syndicates/angels</span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-cyan-600 h-1.5 rounded-full"
              style={{ width: `${investors.length ? (verifiedInvestors.length / investors.length) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Marketplace Deals</span>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              {openDeals.length} Active
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{deals.length}</span>
            <span className="text-xs text-slate-500">
              ({closedDeals.length} closed / funded)
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {deals.filter((d) => d.status === 'draft').length} in draft phase
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Platform Volume</span>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              USD / INR
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              ${(totalVolume / 1000000).toFixed(2)}M
            </span>
            <span className="text-xs text-slate-500">target pipeline</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Avg deal size: ${(totalVolume / (deals.length || 1) / 1000).toFixed(0)}k
          </p>
        </div>
      </div>

      {/* Main Grid: Pending Reviews & Microservices Gateway Health */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Quick Verification Queue & Deals Preview */}
        <div className="space-y-6 lg:col-span-2">
          {/* Startups Verification Queue */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Startups Directory & Status</h2>
                <p className="text-xs text-slate-500">Overview of registered company entities and AI background checks</p>
              </div>
              <Link to="/admin/startups" className="text-xs font-semibold text-emerald-700 hover:underline">
                View All Startups →
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {startups.slice(0, 4).map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">{s.name}</span>
                      <VerificationBadge isVerified={s.is_verified} status={s.verification_status} size="sm" />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {s.industry} • Stage: {s.stage || 'Seed'} • GST: {s.gst_number || 'Missing'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/admin/company-edit?id=${s.id}`}
                      className="rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition"
                    >
                      Edit & Re-verify
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deal Marketplace Snapshot */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Active Deals & Negotiations</h2>
                <p className="text-xs text-slate-500">Live marketplace offerings and multi-party dealrooms</p>
              </div>
              <Link to="/admin/marketplace" className="text-xs font-semibold text-emerald-700 hover:underline">
                Marketplace Supervision →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {deals.slice(0, 4).map((d) => (
                <div key={d.id} className="rounded-lg border border-slate-200 p-4 hover:border-emerald-300 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {d.funding_stage || 'Seed'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        d.status === 'closed'
                          ? 'bg-purple-100 text-purple-700'
                          : d.status === 'negotiating'
                          ? 'bg-amber-100 text-amber-800'
                          : d.status === 'published'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {d.status?.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 mt-2 line-clamp-1">{d.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{d.pitch}</p>
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <span className="font-semibold text-slate-900">
                      ${(Number(d.target_raise) || 0).toLocaleString()}
                    </span>
                    <span className="text-emerald-700 font-medium">
                      {d.equity_pct}% eq + {d.royalty_pct || 0}% roy
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Investors Queue & Gateway Microservices Health */}
        <div className="space-y-6">
          {/* Investors Section */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Investors Directory</h2>
                <p className="text-xs text-slate-500">CV accreditation & dealroom eligibility</p>
              </div>
              <Link to="/admin/investors" className="text-xs font-semibold text-emerald-700 hover:underline">
                View All →
              </Link>
            </div>

            <div className="space-y-3">
              {investors.map((inv) => (
                <div key={inv.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900">{inv.display_name}</span>
                    <VerificationBadge isVerified={inv.is_verified} size="sm" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{inv.firm || 'Independent'}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    CV: {inv.cv_filename || 'Not uploaded (Gated)'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Microservices System Health */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-1">Microservices Mesh</h2>
            <p className="text-xs text-slate-500 mb-4">API Gateway downstream health probes</p>

            <div className="space-y-2.5">
              {health?.downstream ? (
                Object.entries(health.downstream).map(([name, svc]) => (
                  <div key={name} className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                    <span className="font-mono text-slate-700">{name}</span>
                    <span
                      className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[10px] ${
                        svc.status === 'ok' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${svc.status === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {svc.status.toUpperCase()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400">Loading downstream status...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
