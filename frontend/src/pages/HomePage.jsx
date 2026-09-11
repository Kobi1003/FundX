import { Link } from 'react-router-dom'
import Button from '../components/Button'
import PageContainer from '../components/PageContainer'
import {
  Rocket,
  ShieldCheck,
  BrainCircuit,
  TrendingUp,
  Handshake,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react'

export default function HomePage() {
  const pillars = [
    {
      icon: ShieldCheck,
      color: 'from-emerald-500 to-teal-600',
      title: 'Evidence & Claim Verification',
      desc: 'Extracted founder claims are automatically cross-checked against pitch decks, financial docs, and evidence registers.',
    },
    {
      icon: BrainCircuit,
      color: 'from-cyan-500 to-blue-600',
      title: 'Deterministic Simulation Engine',
      desc: 'Financial models for Bull, Base, and Bear scenarios calculated with exact Python models for revenue, burn, and runway.',
    },
    {
      icon: TrendingUp,
      color: 'from-amber-500 to-orange-600',
      title: 'Red-Team Stress Testing',
      desc: 'AI agents aggressively challenge founder assumptions, CAC, market size claims, and runway estimates.',
    },
    {
      icon: Handshake,
      color: 'from-purple-500 to-indigo-600',
      title: 'Multi-Party Digital Deal Rooms',
      desc: 'Matchmaking scoring engine connects startups with institutional investors for transparent negotiation with AI Copilot.',
    },
  ]

  const stats = [
    { label: 'Microservices', val: '6 Active' },
    { label: 'Supported AI Providers', val: 'Gemini, Groq, Mock' },
    { label: 'Simulation Accuracy', val: '100% Deterministic' },
    { label: 'Roadmap Target', val: '13 Full Phases' },
  ]

  return (
    <PageContainer>
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950 p-8 md:p-12">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Powered Startup Investment Marketplace</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl leading-[1.15]">
            Where Founder Claims Meet{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Rigorous Simulation
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            AI Investment Arena converts founder assumptions into validated business models, stress-tests pitch claims against uploaded evidence, and powers multi-party deal rooms with deterministic AI intelligence.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/dashboard">
              <Button variant="primary" className="text-sm px-6 py-3 shadow-emerald-500/25">
                <span>Launch Arena Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/startups">
              <Button variant="outline" className="text-sm px-6 py-3">
                <Rocket className="h-4 w-4" />
                <span>Explore Startups</span>
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="ghost" className="text-sm px-4 py-3">
                <span>Register Account</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mt-12 grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-8 sm:grid-cols-4">
          {stats.map((s, idx) => (
            <div key={idx} className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-4">
              <p className="text-xs font-medium text-slate-400">{s.label}</p>
              <p className="mt-1 text-lg font-bold text-slate-100">{s.val}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Core Architectural Pillars */}
      <div className="mt-12">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Architecture Highlights</h2>
          <p className="mt-2 text-sm text-slate-400">
            Separating deterministic calculations from AI reasoning for zero-hallucination analysis.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {pillars.map((p, idx) => {
            const Icon = p.icon
            return (
              <div
                key={idx}
                className="glass-panel glass-panel-hover p-6 flex flex-col justify-between"
              >
                <div>
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center text-slate-950 shadow-md mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-white">{p.title}</h3>
                  <p className="mt-2 text-sm text-slate-300 leading-relaxed">{p.desc}</p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Roadmap Specification Compliant</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </PageContainer>
  )
}
