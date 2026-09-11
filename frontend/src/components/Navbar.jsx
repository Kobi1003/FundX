import { Link, NavLink } from 'react-router-dom'

const linkClass = ({ isActive }) =>
  `px-3 py-2 text-sm ${isActive ? 'text-[var(--brand)] font-semibold' : 'text-[var(--muted)] hover:text-[var(--brand)]'}`

export default function Navbar() {
  return (
    <header className="border-b border-black/10 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold tracking-tight text-[var(--brand)]">
          AI Investment Arena
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/startups" className={linkClass}>
            Startups
          </NavLink>
          <NavLink to="/investors" className={linkClass}>
            Investors
          </NavLink>
          <NavLink to="/deals" className={linkClass}>
            Deals
          </NavLink>
          <NavLink to="/login" className={linkClass}>
            Login
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
