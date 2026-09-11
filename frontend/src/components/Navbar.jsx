import { Link, NavLink } from 'react-router-dom'
import { LayoutDashboard, Rocket, Users, Handshake, ShieldCheck } from 'lucide-react'
import Logo from './Logo'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/startups', label: 'Startups', icon: Rocket },
  { to: '/investors', label: 'Investors', icon: Users },
  { to: '/deals', label: 'Deals', icon: Handshake },
]

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center group">
          <Logo size="md" />
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/90 px-3 py-1 text-xs text-slate-300">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>DEMO_MODE=true</span>
          </div>
          <Link
            to="/login"
            className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:border-slate-600 transition"
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  )
}
