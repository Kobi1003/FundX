import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import { AuthProvider } from './context/AuthContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import StartupsPage from './pages/StartupsPage'
import NewStartupPage from './pages/NewStartupPage'
import StartupDetailPage from './pages/StartupDetailPage'
import StartupAnalysisPage from './pages/StartupAnalysisPage'
import InvestorsPage from './pages/InvestorsPage'
import InvestorDetailPage from './pages/InvestorDetailPage'
import DealsPage from './pages/DealsPage'
import DealDetailPage from './pages/DealDetailPage'
import DealRoomPage from './pages/DealRoomPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/startups" element={<StartupsPage />} />
          <Route path="/startups/new" element={<NewStartupPage />} />
          <Route path="/startups/:id" element={<StartupDetailPage />} />
          <Route path="/startups/:id/analysis" element={<StartupAnalysisPage />} />
          <Route path="/investors" element={<InvestorsPage />} />
          <Route path="/investors/:id" element={<InvestorDetailPage />} />
          <Route path="/deals" element={<DealsPage />} />
          <Route path="/deals/:id" element={<DealDetailPage />} />
          <Route path="/deal-room/:id" element={<DealRoomPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
