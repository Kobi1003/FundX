import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import Button from '../components/Button'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { api } from '../services/api'
import { Handshake, Filter, Sparkles, ArrowRight, ShieldCheck, DollarSign } from 'lucide-react'

export default function DealsPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    api
      .listDeals()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const displayItems = items.length > 0 ? items : [
    { id: 'deal-1', title: 'QuantumLedger AI — Seed Round', startup_name: 'QuantumLedger AI', status: 'NEGOTIATING', ai_score: 87, amount: '₹2.5 Cr', equity: '12%', industry: 'FinTech', stage: 'Seed' },
    { id: 'deal-2', title: 'BioSynth AI — Pre-Seed Round', startup_name: 'BioSynth AI', status: 'INTERESTED', ai_score: 91, amount: '₹1.0 Cr', equity: '8%', industry: 'HealthTech', stage: 'Pre-Seed' },
    { id: 'deal-3', title: 'NeuralOps — Series A', startup_name: 'NeuralOps Inc', status: 'ACCEPTED', ai_score: 84, amount: '₹5.0 Cr', equity: '15%', industry: 'Enterprise AI', stage: 'Series A' },
  ]

  const filtered = statusFilter === 'ALL' ? displayItems : displayItems.filter(d => d.status === statusFilter)

  return (
    <PageContainer
      title="Deal Marketplace"
      description="Active deals and investment rooms for startups with confirmed AI Intelligence reports."
    >
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 glass-panel p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <Filter className="h-4 w-4 text-emerald-400" />
          <span>Filter by Deal Status:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {['ALL', 'INTERESTED', 'NEGOTIATING', 'ACCEPTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                statusFilter === st
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {loading && <LoadingState label="Loading deal marketplace items…" />}
      {error && <ErrorState message={error} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((deal) => (
          <div key={deal.id || deal.title} className="glass-panel glass-panel-hover p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                    deal.status === 'ACCEPTED'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : deal.status === 'NEGOTIATING'
                      ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}
                >
                  {deal.status}
                </span>

                <div className="flex items-center gap-1 text-xs font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <Sparkles className="h-3 w-3" />
                  <span>Score: {deal.ai_score || 87}</span>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-100 mt-2 mb-1">{deal.title}</h3>
              <p className="text-xs text-slate-400 mb-4">{deal.startup_name || 'Verified Startup'}</p>

              <div className="space-y-2 text-xs text-slate-300 mb-4 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Raise:</span>
                  <span className="font-bold text-white">{deal.amount || '₹2.5 Cr'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Equity Offered:</span>
                  <span className="font-bold text-cyan-400">{deal.equity || '12%'}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <Link to={`/deals/${deal.id}`}>
                <Button variant="ghost" className="text-xs px-2.5 py-1">
                  View Details
                </Button>
              </Link>
              <Link to={`/deal-room/${deal.id}`}>
                <Button variant="primary" className="text-xs px-3 py-1">
                  <Handshake className="h-3.5 w-3.5" />
                  <span>Open Deal Room</span>
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
