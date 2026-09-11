import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function AppLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto flex max-w-6xl">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
