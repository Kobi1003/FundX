import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import VerificationBadge from './VerificationBadge'
import Logo from './Logo'
import { LogIn, LogOut, ShieldCheck, Sparkles, User } from 'lucide-react'

export default function PortalHeader() {
  const navigate = useNavigate()
  const { user, logout } = useAuthContext()

  const role = user?.role || 'guest'

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const getPortalInfo = () => {
    if (role === 'admin') {
      return {
        title: 'Super Admin Command',
        badge: '👑 Super Admin Portal',
        badgeColor: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
      }
    }
    if (role === 'startup') {
      return {
        title: 'Startup Founder Hub',
        badge: '🚀 Founder Portal',
        badgeColor: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
      }
    }
    if (role === 'investor') {
      return {
        title: 'Syndicate Dealroom',
        badge: '💼 Investor Portal',
        badgeColor: 'bg-cyan-400/20 text-cyan-300 border-cyan-400/30',
      }
    }
    return {
      title: 'FundX Portal',
      badge: null,
      badgeColor: '',
    }
  }

  const portal = getPortalInfo()

  return (
    <header className="sticky top-0 z-40 w-full h-16 border-b border-slate-800 bg-slate-900 text-white shadow-md">
      <div className="mx-auto flex h-full max-w-full items-center justify-between px-4 sm:px-6">
        {/* Left Side: Brand Logo & Optional Role Badge */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center group">
            <Logo size="md" textColor="text-white" />
          </Link>

          {portal.badge && (
            <div className="hidden sm:flex items-center gap-2 border-l border-slate-700 pl-4">
              <div
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${portal.badgeColor}`}
              >
                <span>{portal.badge}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Welcome to FundX / User Profile & Sign In Button */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right hidden md:flex">
                <span className="text-xs font-bold text-white">{user.full_name || user.email}</span>
                <span className="text-[10px] text-slate-400 capitalize">{role} Account</span>
              </div>
              {role !== 'admin' && (
                <VerificationBadge isVerified={user.is_verified} size="sm" />
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 text-xs font-semibold transition cursor-pointer border border-slate-700"
                title="Sign out of account"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline-block text-xs font-semibold text-slate-300">
                Welcome to <strong className="text-white font-extrabold">FundX</strong>
              </span>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 px-5 py-2.5 text-xs font-black tracking-wide shadow-md shadow-emerald-500/20 transition-transform duration-150 active:scale-95"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
