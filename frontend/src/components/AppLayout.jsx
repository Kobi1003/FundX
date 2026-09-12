import { Outlet } from 'react-router-dom'
import PortalHeader from './PortalHeader'
import Sidebar from './Sidebar'

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PortalHeader />

      <div className="flex flex-1 w-full">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>

      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>FundX · Venture capital and royalty marketplace</span>
          <span>© {new Date().getFullYear()} FundX. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
