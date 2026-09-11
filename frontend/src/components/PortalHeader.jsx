import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuthContext, DEMO_ACCOUNTS } from '../context/AuthContext'
import VerificationBadge from './VerificationBadge'

export default function PortalHeader() {
  const { user, loginAs, logout } = useAuthContext()
  const location = useLocation()
  const navigate = useNavigate()

  const role = user?.role || 'guest'

  const navLinkClass = ({ isActive }) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-[#0f3d2e] text-white shadow-xs'
        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
    }`

  const handleRoleSwitch = (roleKey) => {
    loginAs(roleKey)
    if (roleKey === 'admin') navigate('/admin/dashboard')
    else if (roleKey === 'startup') navigate('/startup/dashboard')
    else if (roleKey === 'investor' || roleKey === 'investor_unverified') navigate('/investor/dashboard')
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
      {/* Top Bar: Quick Portal Switcher & Live Role Context */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 via-[#0b261e] to-slate-900 px-4 py-1.5 text-xs text-slate-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-300">Quick Portal Switcher:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleRoleSwitch('admin')}
                className={`rounded px-2 py-0.5 font-medium transition cursor-pointer ${
                  role === 'admin'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                👑 Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleRoleSwitch('startup')}
                className={`rounded px-2 py-0.5 font-medium transition cursor-pointer ${
                  role === 'startup'
                    ? 'bg-emerald-400 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                🚀 Startup
              </button>
              <button
                type="button"
                onClick={() => handleRoleSwitch('investor')}
                className={`rounded px-2 py-0.5 font-medium transition cursor-pointer ${
                  role === 'investor' && user?.is_verified
                    ? 'bg-cyan-400 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                💼 Investor (Verified)
              </button>
              <button
                type="button"
                onClick={() => handleRoleSwitch('investor_unverified')}
                className={`rounded px-2 py-0.5 font-medium transition cursor-pointer ${
                  role === 'investor' && !user?.is_verified
                    ? 'bg-amber-300 text-slate-950 font-bold shadow-xs'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Test CV verification gating flow"
              >
                ⚠️ Investor (Unverified)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Logged in as:</span>
                <span className="font-semibold text-white">{user.full_name}</span>
                {user.role !== 'admin' && (
                  <VerificationBadge isVerified={user.is_verified} size="sm" />
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="text-slate-400 hover:text-white underline cursor-pointer ml-1"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-emerald-300 hover:underline">
                  Login
                </Link>
                <span>•</span>
                <Link to="/register" className="text-emerald-300 hover:underline">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0f3d2e] to-[#1c5c46] shadow-sm text-white font-black text-lg tracking-wider">
              FX
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-[#0f3d2e]">
                FUND<span className="text-amber-600">X</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border border-slate-200 rounded px-1.5 py-0.5">
                Arena
              </span>
            </div>
          </Link>

          {/* Role-Specific Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {role === 'admin' && (
              <>
                <NavLink to="/admin/dashboard" className={navLinkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/admin/startups" className={navLinkClass}>
                  Startups
                </NavLink>
                <NavLink to="/admin/investors" className={navLinkClass}>
                  Investors
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
                  Marketplace
                </NavLink>
                <NavLink to="/login" className={navLinkClass}>
                  Login
                </NavLink>
                <NavLink to="/register" className={navLinkClass}>
                  Register
                </NavLink>
              </>
            )}
          </nav>
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          {role === 'startup' && (
            <Link
              to="/startup/deals/create"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f3d2e] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#154e3b] transition"
            >
              <span>+ New Deal</span>
            </Link>
          )}
          {role === 'investor' && !user?.is_verified && (
            <Link
              to="/investor/profile"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-semibold text-slate-950 shadow-xs hover:bg-amber-400 transition"
            >
              <span>Verify CV to Negotiate</span>
            </Link>
          )}
          {role === 'guest' && (
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f3d2e] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#154e3b] transition"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
