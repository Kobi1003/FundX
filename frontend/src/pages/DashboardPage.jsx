import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import Button from '../components/Button'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import DarkVeilCard from '../components/DarkVeilCard'
import { api } from '../services/api'
import {
  Activity,
  Server,
  Layers,
  ShieldCheck,
  Brain,
  Rocket,
  Handshake,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Cpu,
} from 'lucide-react'

export default function DashboardPage() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .health()
      .then(setHealth)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const servicesList = [
    { key: 'user-service', name: 'User Service', port: 8001, desc: 'Profiles & Supabase Auth Sync' },
    { key: 'startup-service', name: 'Startup Service', port: 8002, desc: 'Startups, Claims & Documents' },
    { key: 'investor-service', name: 'Investor Service', port: 8003, desc: 'Investor Profiles & Preferences' },
    { key: 'deal-service', name: 'Deal Service', port: 8004, desc: 'Deals & Multi-Party Rooms' },
    { key: 'ai-service', name: 'AI Service (ADK)', port: 8005, desc: 'Bounded Workflows & Simulation' },
  ]

  const roadmapPhases = [
    { num: 'P0', title: 'Foundation & Docker', status: 'Complete' },
    { num: 'P1', title: 'Onboarding & Profiles', status: 'Complete' },
    { num: 'P2', title: 'Documents & Claims', status: 'Complete' },
    { num: 'P3', title: 'Document AI Intelligence', status: 'Active' },
    { num: 'P4', title: 'Deterministic Financial Engine', status: 'Active' },
    { num: 'P5', title: 'Red-Team Stress Testing', status: 'Active' },
    { num: 'P6', title: 'Investment Intelligence Report', status: 'Active' },
    { num: 'P7', title: 'Founder Iteration Workflow', status: 'Ready' },
    { num: 'P8', title: 'Investor Matching Engine', status: 'Ready' },
    { num: 'P9', title: 'Deal Marketplace', status: 'Active' },
    { num: 'P10', title: 'Multi-Party Deal Rooms', status: 'Active' },
    { num: 'P11', title: 'Negotiation Copilot', status: 'Ready' },
    { num: 'P12', title: 'AI Cache & Failure Tolerance', status: 'Complete' },
  ]

  return (
    <PageContainer
      title="System Overview & Gateway Dashboard"
      description="Real-time status of microservices, AI provider abstractions, and roadmap phase execution."
      action={
        <div className="flex items-center gap-2">
          <Link to="/startups/new">
            <Button variant="primary">
              <Rocket className="h-4 w-4" />
              <span>New Startup</span>
            </Button>
          </Link>
        </div>
      }
    >
      {/* Dark Veil Hero Feature Banner */}
      <div className="mb-6">
        <DarkVeilCard
          title="FundX Gateway & Neural Risk Engine"
          subtitle="Real-time WebGL shader background powered by React Bits Dark Veil and live microservices mesh status."
          defaultHue={135}
          defaultSpeed={0.45}
          defaultWarp={0.3}
        />
      </div>

      {/* Quick Stats Header */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Gateway Status</p>
            <p className="text-sm font-bold text-slate-100 uppercase">
              {health ? health.status || 'OK' : loading ? 'Checking…' : 'Degraded/Offline'}
            </p>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">AI Provider</p>
            <p className="text-sm font-bold text-slate-100">Mock / Gemini / Groq</p>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Demo Safeguards</p>
            <p className="text-sm font-bold text-emerald-400">DEMO_MODE=true</p>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Database Layer</p>
            <p className="text-sm font-bold text-slate-100">Supabase + Neo4j</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Microservices Health Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Microservice Health & Proxy Status"
            subtitle="API Gateway routes incoming /api/* requests to internal Python FastAPI services."
            hover={false}
          >
            {loading && <LoadingState label="Probing backend microservices health…" />}
            {error && <ErrorState message={`Gateway Error: ${error}`} />}

            {health && (
              <div className="space-y-3 mt-2">
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">api-gateway (Port 8000)</span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" />
                    {health.status || 'OK'}
                  </span>
                </div>

                {servicesList.map((svc) => {
                  const info = health.downstream ? health.downstream[svc.key] : null
                  const isOk = info ? info.status === 'ok' : true
                  return (
                    <div
                      key={svc.key}
                      className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3 flex items-center justify-between text-xs hover:border-slate-700 transition"
                    >
                      <div>
                        <p className="font-semibold text-slate-200">{svc.name} (Port {svc.port})</p>
                        <p className="text-[11px] text-slate-400">{svc.desc}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${
                            isOk
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {isOk ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              Active / Ready
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3" />
                              Fallback Active
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Quick Arena Links */}
          <Card title="Arena Actions & Testing" subtitle="Directly trigger features specified in the roadmap.">
            <div className="grid gap-3 sm:grid-cols-3">
              <Link to="/startups" className="group rounded-xl border border-slate-800 bg-slate-900/40 p-4 hover:border-emerald-500/40 hover:bg-slate-900/80 transition">
                <Rocket className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform mb-2" />
                <p className="text-sm font-bold text-white">Startups Directory</p>
                <p className="text-xs text-slate-400 mt-1">Browse startups, pitch claims & documents.</p>
              </Link>

              <Link to="/deals" className="group rounded-xl border border-slate-800 bg-slate-900/40 p-4 hover:border-cyan-500/40 hover:bg-slate-900/80 transition">
                <Handshake className="h-5 w-5 text-cyan-400 group-hover:scale-110 transition-transform mb-2" />
                <p className="text-sm font-bold text-white">Deal Marketplace</p>
                <p className="text-xs text-slate-400 mt-1">Filter deals by AI Score, Valuation & Stage.</p>
              </Link>

              <Link to="/investors" className="group rounded-xl border border-slate-800 bg-slate-900/40 p-4 hover:border-purple-500/40 hover:bg-slate-900/80 transition">
                <Brain className="h-5 w-5 text-purple-400 group-hover:scale-110 transition-transform mb-2" />
                <p className="text-sm font-bold text-white">Investor Directory</p>
                <p className="text-xs text-slate-400 mt-1">Matching scores & investor preferences.</p>
              </Link>
            </div>
          </Card>
        </div>

        {/* Roadmap Phases Status Sidebar */}
        <div className="space-y-6">
          <Card title="13-Phase Roadmap Matrix" subtitle="Development & verification roadmap compliance.">
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {roadmapPhases.map((phase, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/40 px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-400 w-6">{phase.num}</span>
                    <span className="text-slate-200 font-medium">{phase.title}</span>
                  </div>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      phase.status === 'Complete'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : phase.status === 'Active'
                        ? 'bg-cyan-500/15 text-cyan-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {phase.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
