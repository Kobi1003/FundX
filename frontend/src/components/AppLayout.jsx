import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import PortalHeader from './PortalHeader'
import Sidebar from './Sidebar'
import DarkVeil from './DarkVeil'

export default function AppLayout() {
  const location = useLocation()
  const pathname = location.pathname
  const isSimulator = pathname === '/simulation' || pathname.endsWith('/simulator')

  return (
    <div
      className={`relative flex flex-col bg-background text-foreground ${
        isSimulator ? 'h-screen overflow-hidden' : 'min-h-screen'
      }`}
    >
      {/* React Bits Dark Veil Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-25 overflow-hidden mix-blend-multiply">
        <DarkVeil
          hueShift={135}
          speed={0.4}
          warpAmount={0.25}
          noiseIntensity={0.04}
          scanlineIntensity={0.15}
          scanlineFrequency={2.0}
        />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
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
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  initial={{ opacity: 0, y: 10, scale: 0.995 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.995 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className={isSimulator ? 'h-full w-full' : 'w-full'}
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>

        {!isSimulator && (
          <footer className="border-t bg-card/80 backdrop-blur-md">
            <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <span>FundX · Venture capital and royalty marketplace</span>
              <span>© {new Date().getFullYear()} FundX. All rights reserved.</span>
            </div>
          </footer>
        )}
      </div>
    </div>
  )
}


