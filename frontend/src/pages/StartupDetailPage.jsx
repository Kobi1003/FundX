import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import Button from '../components/Button'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { api } from '../services/api'
import {
  Building2,
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  TrendingUp,
  FileText,
  CheckCircle2,
  BarChart3,
} from 'lucide-react'

export default function StartupDetailPage() {
  const { id } = useParams()
  const [startup, setStartup] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .getStartup(id)
      .then(setStartup)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  // Fallback demo data when loading or backend returns simple row
  const data = startup || {
    name: 'QuantumLedger AI',
    description: 'Autonomous AI co-pilot for institutional cross-border settlement and liquidity optimization.',
    industry: 'FinTech',
    stage: 'Seed',
    thesis: 'Achieving 25% MoM growth withCAC ₹450 per merchant. Seeking ₹2.5Cr Seed investment.',
    metrics: { arr: '₹40L', runway: '14 Months', cac: '₹450', churn: '2.1%' },
    claims: [
      { claim: 'Annual revenue is ₹40L', status: 'SUPPORTED', confidence: '0.92' },
      { claim: 'Customer acquisition cost is ₹450', status: 'PARTIALLY_SUPPORTED', confidence: '0.78' },
      { claim: 'Monthly churn rate under 2.5%', status: 'SUPPORTED', confidence: '0.89' },
    ],
  }

  return (
    <PageContainer
      title={data.name || 'Startup Profile'}
      description={`Startup ID: ${id} • Registered under AI Investment Arena`}
      action={
        <div className="flex items-center gap-2">
          <Link to="/startups">
            <Button variant="ghost" className="text-xs">
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
          </Link>
          <Link to={`/startups/${id}/analysis`}>
            <Button variant="primary">
              <Sparkles className="h-4 w-4" />
              <span>Run AI Intelligence Analysis</span>
            </Button>
          </Link>
        </div>
      }
    >
      {loading && <LoadingState label="Fetching startup profile data…" />}
      {error && <ErrorState message={error} />}

      {!loading && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="glass-panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{data.name}</h2>
                  <p className="text-xs text-slate-400">{data.tagline || data.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                  Stage: {data.stage || 'Seed'}
                </span>
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-400 border border-cyan-500/30">
                  Sector: {data.industry || 'FinTech'}
                </span>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                <p className="text-[11px] font-semibold text-slate-400">Current ARR / Rev</p>
                <p className="text-base font-bold text-emerald-400">{data.metrics?.arr || '₹40 Lakh'}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                <p className="text-[11px] font-semibold text-slate-400">Runway</p>
                <p className="text-base font-bold text-cyan-400">{data.metrics?.runway || '14 Months'}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                <p className="text-[11px] font-semibold text-slate-400">Target CAC</p>
                <p className="text-base font-bold text-amber-400">{data.metrics?.cac || '₹450'}</p>
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                <p className="text-[11px] font-semibold text-slate-400">Monthly Churn</p>
                <p className="text-base font-bold text-purple-400">{data.metrics?.churn || '2.1%'}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Thesis Card */}
            <Card title="Investment Thesis & Pitch Claims" hover={false}>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {data.thesis || data.description || 'Founder claims submitted for agentic verification.'}
              </p>

              <div className="space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Verified Claims Register</p>
                {(data.claims || []).map((c, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-800 bg-slate-900/50 p-2.5 flex items-center justify-between text-xs">
                    <span className="text-slate-200">{c.claim}</span>
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                      {c.status}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* AI Analysis Action Panel */}
            <Card title="AI Intelligence Workflows" hover={false}>
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1">
                    <BarChart3 className="h-4 w-4" />
                    <span>Run Bounded ADK AI Analysis</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Executes Document Intelligence, Python Deterministic Simulation (Bull/Base/Bear), Red-Team stress testing, and Cap-Table calculation.
                  </p>
                </div>

                <Link to={`/startups/${id}/analysis`} className="block">
                  <Button variant="primary" className="w-full py-2.5">
                    <Sparkles className="h-4 w-4" />
                    <span>Launch Startup Analysis Report</span>
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
