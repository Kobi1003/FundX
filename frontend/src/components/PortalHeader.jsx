import { Link, NavLink } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import VerificationBadge from './VerificationBadge'
import Logo from './Logo'

export default function PortalHeader() {
  const { user, logout } = useAuthContext()

  const role = user?.role || 'guest'

  const navLinkClass = ({ isActive }) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-[#0f3d2e] text-white shadow-xs'
        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
    }`

  const getPortalLabel = () => {
    if (role === 'admin') return '👑 Super Admin Portal'
    if (role === 'startup') return '🚀 Startup Founder Portal'
    if (role === 'investor') return '💼 Investor Syndicate Portal'
    return '✨ Autonomous Investment Arena'
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      {/* Top Status & Context Bar */}
      <div className="border-b border-slate-100 bg-slate-900 px-4 py-1.5 text-xs text-slate-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-emerald-400">{getPortalLabel()}</span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Account:</span>
                <span className="font-semibold text-white">{user.full_name || user.email}</span>
                {role !== 'admin' && (
                  <VerificationBadge isVerified={user.is_verified} size="sm" />
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="text-slate-400 hover:text-white underline cursor-pointer ml-2 text-[11px]"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Welcome to FundX</span>
                <Link
                  to="/login"
                  className="text-emerald-300 font-semibold hover:text-white transition underline"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center group">
            <Logo size="md" />
          </Link>

          {/* Role-Specific Isolated Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            {role === 'admin' && (
              <>
                <NavLink to="/admin/dashboard" className={navLinkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/admin/startups" className={navLinkClass}>
                  Startups Directory
                </NavLink>
                <NavLink to="/admin/investors" className={navLinkClass}>
                  Investors Directory
                </NavLink>
                <NavLink to="/admin/marketplace" className={navLinkClass}>
                  Deal Marketplace
                </NavLink>
                <NavLink to="/admin/company-edit" className={navLinkClass}>
                  Edit Company
                </NavLink>
              </>
            )}

            {role === 'startup' && (
              <>
                <NavLink to="/startup/dashboard" className={navLinkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/startup/dealroom" className={navLinkClass}>
                  Dealroom
                </NavLink>
                <NavLink to="/startup/verifier" className={navLinkClass}>
                  AI Verifier
                </NavLink>
                <NavLink to="/startup/deals/create" className={navLinkClass}>
                  + Create Deal
                </NavLink>
              </>
            )}

            {role === 'investor' && (
              <>
                <NavLink to="/investor/dashboard" className={navLinkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/investor/deals" className={navLinkClass}>
                  Listed Deals
                </NavLink>
                <NavLink to="/investor/dealroom" className={navLinkClass}>
                  Dealroom
                </NavLink>
                <NavLink to="/investor/profile" className={navLinkClass}>
                  Edit Profile & CV
                </NavLink>
              </>
            )}

            {role === 'guest' && (
              <>
                <NavLink to="/" className={navLinkClass}>
                  Home
                </NavLink>
                <NavLink to="/investor/deals" className={navLinkClass}>
                  Explore Deals
                </NavLink>
              </>
            )}
          </nav>
        </div>

        {/* Right CTA / Action Button */}
        <div className="flex items-center gap-3">
          {role === 'startup' && (
            <Link
              to="/startup/deals/create"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f3d2e] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#154e3b] transition"
            >
              <span>+ New Deal</span>
            </Link>
          )}

          {role === 'investor' && !user?.is_verified && (
            <Link
              to="/investor/profile"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-xs hover:bg-amber-400 transition"
            >
              <span>Verify CV to Negotiate</span>
            </Link>
          )}

          {role === 'admin' && (
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-amber-400 shadow-xs hover:bg-slate-800 transition border border-amber-400/30"
            >
              <span>👑 Admin Command</span>
            </Link>
          )}

          {role === 'guest' && (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0f3d2e] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#154e3b] transition cursor-pointer"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
