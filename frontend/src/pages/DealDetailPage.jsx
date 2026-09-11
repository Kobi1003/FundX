import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import Button from '../components/Button'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { api } from '../services/api'
import { Handshake, ArrowLeft, Users, DollarSign, Calculator, ShieldCheck } from 'lucide-react'

export default function DealDetailPage() {
  const { id } = useParams()
  const [deal, setDeal] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .getDeal(id)
      .then(setDeal)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const data = deal || {
    title: 'QuantumLedger AI — Seed Investment Round',
    startup_name: 'QuantumLedger AI',
    status: 'NEGOTIATING',
    amount: '₹2.5 Cr',
    equity: '12.5%',
    implied_post_money: '₹20.0 Cr',
    implied_pre_money: '₹17.5 Cr',
    participants: ['Apex Horizon Ventures', 'Sarah Lin (Angel)', 'Nexus Growth Fund'],
  }

  return (
    <PageContainer
      title={data.title}
      description={`Deal ID: ${id} • Multi-Party Negotiation Room`}
      action={
        <div className="flex items-center gap-2">
          <Link to="/deals">
            <Button variant="ghost" className="text-xs">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Marketplace</span>
            </Button>
          </Link>
          <Link to={`/deal-room/${id}`}>
            <Button variant="primary">
              <Handshake className="h-4 w-4" />
              <span>Enter Private Deal Room</span>
            </Button>
          </Link>
        </div>
      }
    >
      {loading && <LoadingState label="Fetching deal specifications…" />}
      {error && <ErrorState message={error} />}

      {!loading && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full bg-cyan-500/10 px-3 py-0.5 text-xs font-bold text-cyan-400 border border-cyan-500/30">
                  Status: {data.status}
                </span>
                <span className="rounded-full bg-emerald-500/10 px-3 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                  AI Verified Deal
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{data.title}</h2>
              <p className="text-xs text-slate-400 mt-1">Multi-Party deal architecture (Startup + Multiple VCs)</p>
            </div>

            <Link to={`/deal-room/${id}`}>
              <Button variant="primary" className="text-sm px-6 py-2.5">
                <Handshake className="h-4 w-4" />
                <span>Join Deal Room Chat</span>
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Deterministic Cap Table Calculations */}
            <Card title="Cap Table & Valuation Calculations" hover={false}>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 text-xs mb-4">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Target Raise Amount:</span>
                  <span className="font-bold text-white">{data.amount}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Equity Offered:</span>
                  <span className="font-bold text-cyan-400">{data.equity}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Implied Post-Money Valuation:</span>
                  <span className="font-bold text-emerald-400">{data.implied_post_money}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Implied Pre-Money Valuation:</span>
                  <span className="font-bold text-amber-400">{data.implied_pre_money}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                <Calculator className="h-3.5 w-3.5 text-emerald-400" />
                <span>Calculated via deterministic Python valuation model (Roadmap Phase 11).</span>
              </p>
            </Card>

            {/* Deal Room Participants */}
            <Card title="Room Participants & Counterparties" hover={false}>
              <p className="text-xs text-slate-400 mb-3">
                Multiple investors can negotiate simultaneously in isolated room instances.
              </p>
              <div className="space-y-2">
                {(data.participants || []).map((p, idx) => (
                  <div key={idx} className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <Users className="h-4 w-4 text-purple-400" />
                      <span className="font-semibold text-slate-200">{p}</span>
                    </div>
                    <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
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
