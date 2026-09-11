import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import Button from '../components/Button'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { api } from '../services/api'
import { Users, Building, DollarSign, Target, Sparkles, ArrowRight } from 'lucide-react'

export default function InvestorsPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .listInvestors()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  // Sample investors if backend returns empty list
  const displayItems = items.length > 0 ? items : [
    { id: 'inv-1', display_name: 'Apex Horizon Ventures', firm: 'Apex Capital', stage: 'Seed / Series A', check_size: '₹50L - ₹2Cr', sectors: ['FinTech', 'SaaS'], risk: 'Medium' },
    { id: 'inv-2', display_name: 'Sarah Lin', firm: 'Angel Syndicate', stage: 'Pre-Seed / Seed', check_size: '₹25L - ₹75L', sectors: ['Enterprise AI', 'DeepTech'], risk: 'High' },
    { id: 'inv-3', display_name: 'Nexus Growth Fund', firm: 'Nexus Partners', stage: 'Series A / B', check_size: '₹2Cr - ₹10Cr', sectors: ['HealthTech', 'CleanTech'], risk: 'Low' },
  ]

  return (
    <PageContainer
      title="Investor Directory"
      description="Institutional VCs and syndicate angels participating in the AI Investment Arena."
    >
      {loading && <LoadingState label="Fetching investor profiles & preferences…" />}
      {error && <ErrorState message={error} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayItems.map((inv) => (
          <div key={inv.id || inv.display_name} className="glass-panel glass-panel-hover p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100">{inv.display_name}</h3>
                    <p className="text-xs text-slate-400">{inv.firm || 'Independent VC'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300 mb-4">
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">Target Check Size:</span>
                  <span className="font-semibold text-emerald-400">{inv.check_size || '₹50L - ₹2Cr'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">Preferred Stage:</span>
                  <span className="font-semibold text-cyan-400">{inv.stage || 'Seed'}</span>
                </div>
                <div className="flex justify-between pb-1.5">
                  <span className="text-slate-400">Risk Appetite:</span>
                  <span className="font-semibold text-amber-400">{inv.risk || 'Medium'}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {(inv.sectors || ['FinTech', 'SaaS']).map((s, idx) => (
                  <span key={idx} className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                <Sparkles className="h-3 w-3" />
                Matching Score Ready
              </span>
              <Link to={`/investors/${inv.id}`}>
                <Button variant="outline" className="text-xs px-3 py-1">
                  <span>View Thesis</span>
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  )
}
