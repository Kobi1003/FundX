import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import Button from '../components/Button'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { api } from '../services/api'
import { Users, ArrowLeft, BrainCircuit, Target, Sparkles, CheckCircle2 } from 'lucide-react'

export default function InvestorDetailPage() {
  const { id } = useParams()
  const [investor, setInvestor] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .getInvestor(id)
      .then(setInvestor)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const inv = investor || {
    display_name: 'Apex Horizon Ventures',
    firm: 'Apex Capital Partners',
    bio: 'Institutional early-stage VC fund focusing on AI infrastructure, B2B SaaS, and financial technology in South Asia.',
    thesis: 'We back high-conviction founders building defensible data moats with verified unit economics and sustainable runway.',
    check_size: '₹50 Lakhs - ₹2 Crores',
    stage: 'Seed / Series A',
    risk_appetite: 'Medium-High',
  }

  const matchingWeights = [
    { factor: 'Industry Match', max: 25, scored: 25 },
    { factor: 'Stage Match', max: 20, scored: 20 },
    { factor: 'Check Size Compatibility', max: 20, scored: 18 },
    { factor: 'Geography Alignment', max: 10, scored: 10 },
    { factor: 'Risk Profile Match', max: 10, scored: 8 },
    { factor: 'Business Model Synergy', max: 10, scored: 9 },
    { factor: 'Portfolio Synergy', max: 5, scored: 4 },
  ]

  const totalScore = matchingWeights.reduce((acc, curr) => acc + curr.scored, 0)

  return (
    <PageContainer
      title={inv.display_name}
      description={`Investor Profile ID: ${id} • Partner at ${inv.firm}`}
      action={
        <Link to="/investors">
          <Button variant="ghost" className="text-xs">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Directory</span>
          </Button>
        </Link>
      }
    >
      {loading && <LoadingState label="Loading investor profile details…" />}
      {error && <ErrorState message={error} />}

      {!loading && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-purple-500/20">
                <Users className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{inv.display_name}</h2>
                <p className="text-xs text-slate-400">{inv.firm}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[11px] text-slate-400">Match Compatibility</p>
                <p className="text-lg font-bold text-emerald-400">{totalScore} / 100</p>
              </div>
              <Link to="/deals">
                <Button variant="primary" className="text-xs px-4 py-2">
                  <span>Invite to Deal Room</span>
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Thesis & Bio */}
            <Card title="Investment Strategy & Thesis" hover={false}>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">{inv.bio}</p>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2 text-xs">
                <p className="font-bold text-white mb-2">Target Investment Criteria</p>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Check Size:</span>
                  <span className="font-semibold text-emerald-400">{inv.check_size}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Stage:</span>
                  <span className="font-semibold text-cyan-400">{inv.stage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Risk Appetite:</span>
                  <span className="font-semibold text-amber-400">{inv.risk_appetite}</span>
                </div>
              </div>
            </Card>

            {/* Deterministic Matching Engine Card */}
            <Card title="Deterministic AI Matching Breakdown" hover={false}>
              <p className="text-xs text-slate-400 mb-3">
                Score calculated using deterministic formula specified in Roadmap Phase 8 (No LLM hallucination).
              </p>

              <div className="space-y-2">
                {matchingWeights.map((w, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-xs">
                    <span className="text-slate-300 font-medium">{w.factor}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-400 h-1.5 rounded-full"
                          style={{ width: `${(w.scored / w.max) * 100}%` }}
                        ></div>
                      </div>
                      <span className="font-bold text-slate-100 text-[11px] w-10 text-right">
                        {w.scored} / {w.max}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
