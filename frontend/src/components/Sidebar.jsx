import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Rocket,
  PlusCircle,
  Users,
  Handshake,
  BrainCircuit,
  Layers,
  FileCheck2,
} from 'lucide-react'

const navGroups = [
  {
    title: 'Platform Navigation',
    items: [
      { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
      { to: '/startups', label: 'Startups Hub', icon: Rocket },
      { to: '/startups/new', label: 'Register Startup', icon: PlusCircle },
      { to: '/investors', label: 'Investor Directory', icon: Users },
      { to: '/deals', label: 'Deal Marketplace', icon: Handshake },
    ],
  },
  {
    title: 'AI Arena Architecture',
    items: [
      { to: '/dashboard#simulation', label: 'Financial Simulation', icon: BrainCircuit },
      { to: '/dashboard#evidence', label: 'Evidence Verification', icon: FileCheck2 },
      { to: '/dashboard#phases', label: '13-Phase Roadmap', icon: Layers },
    ],
  },
]

export default function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-slate-800/80 bg-slate-950/40 p-4 lg:block">
      <div className="space-y-6">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            <p className="mb-2.5 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {group.title}
            </p>
            <ul className="space-y-1">
              {group.items.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Gateway Connected
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Python FastAPI backend microservices operational with deterministic simulation.
        </p>
      </div>
    </aside>
  )
}
