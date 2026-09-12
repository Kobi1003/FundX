import { Outlet, useLocation } from 'react-router-dom'
import PortalHeader from './PortalHeader'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const { pathname } = useLocation()
  const isSimulator = pathname === '/simulation' || pathname.endsWith('/simulator')

  return (
    <div
      className={`flex flex-col bg-background ${
        isSimulator ? 'h-screen overflow-hidden' : 'min-h-screen'
      }`}
    >
      <PortalHeader />

      <div className="flex min-h-0 flex-1 w-full">
        <Sidebar />
        <main
          className={`min-w-0 flex-1 overflow-x-hidden ${
            isSimulator
              ? 'overflow-hidden px-2 py-2 sm:px-3 sm:py-3'
              : 'px-4 py-6 sm:px-6 lg:px-8'
          }`}
        >
          <div className={isSimulator ? 'h-full w-full' : 'mx-auto w-full max-w-[1600px]'}>
            <Outlet />
          </div>
        </main>
      </div>

      {!isSimulator && (
        <footer className="border-t bg-card">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <span>FundX · Venture capital and royalty marketplace</span>
            <span>© {new Date().getFullYear()} FundX. All rights reserved.</span>
          </div>
        </footer>
      )}
    </div>
  )
}
