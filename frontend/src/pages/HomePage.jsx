import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuthContext()

  const handlePortalEntry = (targetRole, path) => {
    if (user?.role === targetRole) {
      navigate(path)
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="space-y-12 py-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#09221a] via-[#0f3d2e] to-[#154e3b] px-6 py-16 sm:px-12 sm:py-20 text-white shadow-2xl border border-emerald-900/60">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/20 px-4 py-1 text-xs font-bold text-amber-300 border border-amber-400/30">
            <span>✨ Autonomous Multi-Agent Investment Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
            Next-Gen Venture Capital & <span className="text-amber-400">Royalty Marketplace</span>
          </h1>

          <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed">
            FUNDX connects high-conviction startups and accredited angel syndicates. Featuring agentic AI background compliance audits, 12-month mathematical feasibility simulations, and real-time multi-party dealroom negotiation trees.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/register"
              className="rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 px-6 py-3.5 text-xs font-black transition shadow-lg"
            >
              Get Started • Register Account
            </Link>
            <Link
              to="/login"
              className="rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 px-6 py-3.5 text-xs font-bold transition backdrop-blur-xs"
            >
              Sign In to Account →
            </Link>
          </div>
        </div>

        {/* Decorative blur glows */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-20 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 3 Core Portals Section */}
      <div>
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Platform Portals & Workflows</h2>
          <p className="text-xs text-slate-500 mt-1">
            Access your isolated role portal: Super Admin, Startup Founder, or Investor Syndicate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Portal 1: Super Admin */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-amber-400 hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
                  👑
                </span>
                <span className="rounded-full bg-amber-50 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 border border-amber-200">
                  Platform Oversight
                </span>
              </div>
              <h3 className="font-bold text-lg text-slate-900">Super Admin Portal</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Platform-wide governance: supervise startups and investors, monitor the aggregated deal marketplace, inspect statutory documents, and run AI re-verifications.
              </p>

              <ul className="mt-4 space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-1.5">
                  <span className="text-amber-500">✦</span> <strong>Super Admin Dashboard:</strong> Global metrics
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-amber-500">✦</span> <strong>Startups & Investors:</strong> Directories
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-amber-500">✦</span> <strong>Deal Marketplace:</strong> Ongoing & closed
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-amber-500">✦</span> <strong>Edit Company:</strong> GST & Inc re-audit
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handlePortalEntry('admin', '/admin/dashboard')}
              className="mt-6 w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-2.5 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              {user?.role === 'admin' ? 'Enter Super Admin Portal →' : 'Sign In as Admin →'}
            </button>
          </div>

          {/* Portal 2: Startup */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-emerald-400 hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
                  🚀
                </span>
                <span className="rounded-full bg-emerald-50 text-emerald-900 text-[10px] font-bold px-2.5 py-0.5 border border-emerald-200">
                  Founder Hub
                </span>
              </div>
              <h3 className="font-bold text-lg text-slate-900">Startup Portal</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Register with GST & Incorporation credentials, verify your company with the AI Verifier, configure hybrid equity + royalty deals, and run market simulations.
              </p>

              <ul className="mt-4 space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600">✓</span> <strong>AI Verifier:</strong> Background check & badge
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600">✓</span> <strong>Deal Creation:</strong> Thesis upload & AI analysis
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600">✓</span> <strong>Market Simulation:</strong> Bull, base, bear
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600">✓</span> <strong>Dealroom:</strong> Investor offers & closing
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handlePortalEntry('startup', '/startup/dashboard')}
              className="mt-6 w-full rounded-xl bg-[#0f3d2e] hover:bg-[#165540] text-white py-2.5 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              {user?.role === 'startup' ? 'Enter Startup Portal →' : 'Sign In / Register as Startup →'}
            </button>
          </div>

          {/* Portal 3: Investor */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs hover:border-cyan-400 hover:shadow-md transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-2xl">
                  💼
                </span>
                <span className="rounded-full bg-cyan-50 text-cyan-900 text-[10px] font-bold px-2.5 py-0.5 border border-cyan-200">
                  Angel / VC Syndicate
                </span>
              </div>
              <h3 className="font-bold text-lg text-slate-900">Investor Portal</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Browse listed deals with rich filters, review AI feasibility scores, upload CV for AI accreditation, and enter the Dealroom to issue and negotiate term sheets.
              </p>

              <ul className="mt-4 space-y-1.5 text-xs text-slate-600">
                <li className="flex items-center gap-1.5">
                  <span className="text-cyan-600">✦</span> <strong>CV Verification Gating:</strong> Required to negotiate
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-cyan-600">✦</span> <strong>Listed Deals:</strong> Deep filters & simulation preview
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-cyan-600">✦</span> <strong>Negotiation Tree:</strong> Visual offer progression
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-cyan-600">✦</span> <strong>Closed Deals:</strong> Portfolio tracker
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handlePortalEntry('investor', '/investor/dashboard')}
              className="mt-6 w-full rounded-xl bg-slate-900 hover:bg-slate-800 text-white py-2.5 text-xs font-bold transition shadow-xs cursor-pointer"
            >
              {user?.role === 'investor' ? 'Enter Investor Portal →' : 'Sign In / Register as Investor →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
