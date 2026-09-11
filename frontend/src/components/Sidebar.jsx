import { NavLink } from 'react-router-dom'

const items = [
  { to: '/dashboard', label: 'Overview' },
  { to: '/startups', label: 'Startups' },
  { to: '/startups/new', label: 'New startup' },
  { to: '/investors', label: 'Investors' },
  { to: '/deals', label: 'Deals' },
]

export default function Sidebar() {
  return (
    <aside className="hidden w-52 shrink-0 border-r border-black/10 bg-white/50 p-4 md:block">
      <p className="mb-3 text-xs uppercase tracking-wider text-[var(--muted)]">Navigate</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `block rounded px-2 py-1.5 text-sm ${
                  isActive ? 'bg-[var(--brand)] text-white' : 'text-[var(--ink)] hover:bg-black/5'
                }`
              }
            >
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  )
}
