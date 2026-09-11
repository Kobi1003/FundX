import { Outlet } from 'react-router-dom'
import PortalHeader from './PortalHeader'

export default function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9f8]">
      <PortalHeader />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>FUNDX AI Investment Arena • Multi-Agent Autonomous Capital Platform</span>
          <span className="text-slate-400">Powered by FastAPI, Supabase, Neo4j & AI Verifier Agents</span>
        </div>
      </footer>
    </div>
  )
}
