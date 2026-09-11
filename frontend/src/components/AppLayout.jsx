import { Outlet } from 'react-router-dom'
import PortalHeader from './PortalHeader'
import Sidebar from './Sidebar'

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9f8]">
      {/* Top Header Bar */}
      <PortalHeader />

      {/* Main Column Body: Leftmost Sidebar + Center Page Content */}
      <div className="flex flex-1 w-full">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 max-w-7xl">
          <Outlet />
        </main>
      </div>

      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FUNDX • Venture Capital & Royalty Marketplace</span>
          <span className="text-slate-400">© {new Date().getFullYear()} FundX. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
