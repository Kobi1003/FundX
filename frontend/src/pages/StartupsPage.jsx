import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import Button from '../components/Button'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { api } from '../services/api'
import { Rocket, Sparkles, Building2, Search, ArrowRight, ShieldCheck } from 'lucide-react'

export default function StartupsPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api
      .listStartups()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = items.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.industry?.toLowerCase().includes(search.toLowerCase()) ||
      s.tagline?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PageContainer
      title="Startups Hub"
      description="Registered startups in the AI Investment Arena available for claim verification and simulation."
      action={
        <Link to="/startups/new">
          <Button variant="primary">
            <Rocket className="h-4 w-4" />
            <span>Register Startup</span>
          </Button>
        </Link>
      }
    >
      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Filter startups by name, industry, or tagline…"
          className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <LoadingState label="Loading registered startups…" />}
      {error && <ErrorState message={error} />}

      {!loading && !error && filtered.length === 0 && (
        <div className="glass-panel p-8 text-center max-w-lg mx-auto">
          <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-3">
            <Rocket className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white">No Startups Found</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            {search ? 'No startups match your search filter.' : 'No startups registered in the system yet.'}
          </p>
          <Link to="/startups/new">
            <Button variant="primary">Register First Startup</Button>
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((s) => (
          <div key={s.id || s.name} className="glass-panel glass-panel-hover p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{s.name}</span>
                </h3>
                <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-slate-300 border border-slate-700">
                  {s.stage || 'Seed'}
                </span>
              </div>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
                {s.tagline || s.description || 'AI-driven business model in investment pipeline.'}
              </p>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                  {s.industry || 'FinTech'}
                </span>
                {s.is_verified && (
                  <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    CIN Verified
                  </span>
                )}
                {!s.is_verified && (
                  <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400 border border-amber-500/20">
                    Pending Verification
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 mt-2">
              <Link to={`/startups/${s.id || 'demo-1'}`}>
                <Button variant="ghost" className="text-xs px-2.5 py-1">
                  View Profile
                </Button>
              </Link>
              <Link to={`/startups/${s.id || 'demo-1'}/analysis`}>
                <Button variant="outline" className="text-xs px-2.5 py-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>AI Analysis</span>
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
