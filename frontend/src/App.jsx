import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import { AuthProvider, useAuthContext } from './context/AuthContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Super Admin Portal Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminStartupsPage from './pages/admin/AdminStartupsPage'
import AdminInvestorsPage from './pages/admin/AdminInvestorsPage'
import AdminMarketplacePage from './pages/admin/AdminMarketplacePage'
import AdminEditCompanyPage from './pages/admin/AdminEditCompanyPage'

// Startup Portal Pages
import StartupDashboardPage from './pages/startup/StartupDashboardPage'
import StartupDealroomPage from './pages/startup/StartupDealroomPage'
import StartupVerifierPage from './pages/startup/StartupVerifierPage'
import StartupCreateDealPage from './pages/startup/StartupCreateDealPage'

// Investor Portal Pages
import InvestorDashboardPage from './pages/investor/InvestorDashboardPage'
import InvestorListedDealsPage from './pages/investor/InvestorListedDealsPage'
import InvestorDealroomPage from './pages/investor/InvestorDealroomPage'
import InvestorMyDealsPage from './pages/investor/InvestorMyDealsPage'
import InvestorProfilePage from './pages/investor/InvestorProfilePage'
import SimulationPage from './pages/SimulationPage'

function DashboardRedirect() {
  const { user } = useAuthContext()
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  if (user.role === 'startup') return <Navigate to="/startup/dashboard" replace />
  return <Navigate to="/investor/dashboard" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route path="/simulation" element={<SimulationPage />} />

            {/* Super Admin Portal */}
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/startups" element={<AdminStartupsPage />} />
            <Route path="/admin/investors" element={<AdminInvestorsPage />} />
            <Route path="/admin/marketplace" element={<AdminMarketplacePage />} />
            <Route path="/admin/company-edit" element={<AdminEditCompanyPage />} />

            {/* Startup Portal */}
            <Route path="/startup" element={<StartupDashboardPage />} />
            <Route path="/startup/dashboard" element={<StartupDashboardPage />} />
            <Route path="/startup/dealroom" element={<StartupDealroomPage />} />
            <Route path="/startup/verifier" element={<StartupVerifierPage />} />
            <Route path="/startup/simulator" element={<Navigate to="/simulation" replace />} />
            <Route path="/startup/deals/create" element={<StartupCreateDealPage />} />

            {/* Investor Portal */}
            <Route path="/investor" element={<InvestorDashboardPage />} />
            <Route path="/investor/dashboard" element={<InvestorDashboardPage />} />
            <Route path="/investor/deals" element={<InvestorListedDealsPage />} />
            <Route path="/investor/dealroom" element={<InvestorDealroomPage />} />
            <Route path="/investor/my-deals" element={<InvestorMyDealsPage />} />
            <Route path="/investor/profile" element={<InvestorProfilePage />} />
            <Route path="/investor/simulator" element={<Navigate to="/simulation" replace />} />

            {/* Legacy Fallbacks */}
            <Route path="/startups" element={<AdminStartupsPage />} />
            <Route path="/investors" element={<AdminInvestorsPage />} />
            <Route path="/deals" element={<InvestorListedDealsPage />} />
            <Route path="/deal-room/:id" element={<InvestorDealroomPage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
