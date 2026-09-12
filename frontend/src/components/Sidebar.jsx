import { NavLink } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
import VerificationBadge from './VerificationBadge'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Rocket,
  Users,
  Handshake,
  ShieldCheck,
  PlusCircle,
  Layers,
  UserCheck,
  LogIn,
  UserPlus,
  Compass,
  FileCheck2,
  LineChart,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Sidebar() {
  const { user } = useAuthContext()
  const role = user?.role || 'guest'

  const getNavSections = () => {
    if (role === 'admin') {
      return [
        {
          title: 'Admin',
          items: [
            { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { to: '/admin/startups', label: 'Startups', icon: Rocket },
            { to: '/admin/investors', label: 'Investors', icon: Users },
            { to: '/admin/marketplace', label: 'Marketplace', icon: Handshake },
            { to: '/admin/company-edit', label: 'Company audit', icon: ShieldCheck },
            { to: '/simulation', label: 'Financial Simulator', icon: LineChart },
          ],
        },
      ]
    }

    if (role === 'startup') {
      return [
        {
          title: 'Founder',
          items: [
            { to: '/startup/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { to: '/startup/dealroom', label: 'Dealroom', icon: Handshake },
            { to: '/startup/verifier', label: 'AI verifier', icon: ShieldCheck },
            { to: '/startup/deals/create', label: 'Create deal', icon: PlusCircle },
            { to: '/simulation', label: 'Financial Simulator', icon: LineChart },
          ],
        },
      ]
    }

    if (role === 'investor') {
      return [
        {
          title: 'Investor',
          items: [
            { to: '/investor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { to: '/investor/deals', label: 'Listed deals', icon: Layers },
            { to: '/investor/dealroom', label: 'Dealroom', icon: Handshake },
            { to: '/investor/my-deals', label: 'My deals', icon: FileCheck2 },
            { to: '/investor/profile', label: 'Profile & verification', icon: UserCheck },
            { to: '/simulation', label: 'Financial Simulator', icon: LineChart },
          ],
        },
      ]
    }

    return [
      {
        title: 'Platform',
        items: [
          { to: '/', label: 'Home', icon: Compass },
          { to: '/investor/deals', label: 'Explore deals', icon: Layers },
          { to: '/login', label: 'Sign in', icon: LogIn },
          { to: '/register', label: 'Register', icon: UserPlus },
          { to: '/simulation', label: 'Financial Simulator', icon: LineChart },
        ],
      },
    ]
  }

  const sections = getNavSections()

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
      <div className="flex flex-1 flex-col justify-between p-4">
        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
              <ul className="space-y-1">
                {section.items.map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={to === '/'}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )
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

        {user && (
          <div className="rounded-xl border bg-muted/40 p-3">
            <p className="truncate text-sm font-medium">{user.full_name || user.email}</p>
            <p className="mt-0.5 truncate text-xs capitalize text-muted-foreground">
              {user.firm || `${role} workspace`}
            </p>
            {role !== 'admin' && (
              <>
                <Separator className="my-2.5" />
                <VerificationBadge isVerified={user.is_verified} size="sm" />
              </>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
