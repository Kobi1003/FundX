import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import VerificationBadge from './VerificationBadge'
import Logo from './Logo'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { LogIn, LogOut, ShieldCheck, Rocket, Briefcase } from 'lucide-react'

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
        tone: 'text-amber-700',
        badge: (
          <>
            <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
            Super Admin
          </>
        ),
      }
    }
    if (role === 'startup') {
      return {
        tone: 'text-emerald-700',
        badge: (
          <>
            <Rocket className="h-3.5 w-3.5 text-emerald-600" />
            Founder
          </>
        ),
      }
    }
    if (role === 'investor') {
      return {
        tone: 'text-sky-700',
        badge: (
          <>
            <Briefcase className="h-3.5 w-3.5 text-sky-600" />
            Investor
          </>
        ),
      }
    }
    return { badge: null, tone: '' }
  }

  const portal = getPortalInfo()

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex h-14 w-full items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center group">
            <Logo size="md" textColor="text-foreground" />
          </Link>

          {portal.badge && (
            <div className="hidden items-center gap-3 sm:flex">
              <Separator orientation="vertical" className="h-5" />
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${portal.tone}`}>
                {portal.badge}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="hidden text-right md:block">
                <p className="text-sm font-medium leading-none">{user.full_name || user.email}</p>
                <p className="mt-0.5 text-xs capitalize text-muted-foreground">{role} account</p>
              </div>
              {role !== 'admin' && (
                <VerificationBadge isVerified={user.is_verified} size="sm" />
              )}
              <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
                <LogOut />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <>
              <span className="hidden text-sm text-muted-foreground sm:inline">Welcome to FundX</span>
              <Button asChild size="sm">
                <Link to="/login">
                  <LogIn />
                  Sign In
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
