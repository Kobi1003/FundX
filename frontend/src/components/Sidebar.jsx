import { NavLink } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'
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
  Sparkles,
} from 'lucide-react'

export default function Sidebar() {
  const { user } = useAuthContext()
  const role = user?.role || 'guest'

  const getNavSections = () => {
    if (role === 'admin') {
      return [
        {
          title: 'Super Admin Portal',
          items: [
            { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { to: '/admin/startups', label: 'Startups Directory', icon: Rocket },
            { to: '/admin/investors', label: 'Investors Directory', icon: Users },
            { to: '/admin/marketplace', label: 'Deal Marketplace', icon: Handshake },
            { to: '/admin/company-edit', label: 'Edit Company & Audit', icon: ShieldCheck },
          ],
        },
      ]
    }

    if (role === 'startup') {
      return [
        {
          title: 'Startup Founder Portal',
          items: [
            { to: '/startup/dashboard', label: 'Founder Dashboard', icon: LayoutDashboard },
            { to: '/startup/dealroom', label: 'Dealroom Negotiations', icon: Handshake },
            { to: '/startup/verifier', label: 'AI Claims Verifier', icon: ShieldCheck },
            { to: '/startup/deals/create', label: 'Create New Deal', icon: PlusCircle },
          ],
        },
      ]
    }

    if (role === 'investor') {
      return [
        {
          title: 'Investor Syndicate Portal',
          items: [
            { to: '/investor/dashboard', label: 'Investor Dashboard', icon: LayoutDashboard },
            { to: '/investor/deals', label: 'Listed Startup Deals', icon: Layers },
            { to: '/investor/dealroom', label: 'Dealroom', icon: Handshake },
            { to: '/investor/my-deals', label: 'My Deals', icon: FileCheck2 },
            { to: '/investor/profile', label: 'Profile & CV Verification', icon: UserCheck },
          ],
        },
      ]
    }

    // Guest / Public navigation
    return [
      {
        title: 'Platform Navigation',
        items: [
          { to: '/', label: 'Home Dashboard', icon: Compass },
          { to: '/investor/deals', label: 'Explore Listed Deals', icon: Layers },
          { to: '/login', label: 'Sign In to Account', icon: LogIn },
          { to: '/register', label: 'Register Account', icon: UserPlus },
        ],
      },
    ]
  }

  const sections = getNavSections()

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-white min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shadow-xs">
      <div className="space-y-6">
        {sections.map((section, idx) => (
          <div key={idx}>
            <p className="mb-3 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {section.title}
            </p>
            <ul className="space-y-1.5">
              {section.items.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all duration-150 ${
                        isActive
                          ? 'bg-[#0f3d2e] text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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

    </aside>
  )
}
