import { Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import Button from '../components/Button'
import { Cpu, ShieldCheck, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  return (
    <PageContainer>
      <div className="mx-auto max-w-md py-12">
        <Card hover={false}>
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/20 text-slate-950">
              <Cpu className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">Sign In to Arena</h2>
            <p className="mt-1 text-xs text-slate-400">
              Supabase Auth syncs user profiles with backend microservices.
            </p>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  className="glass-input w-full pl-10 pr-3.5 py-2.5 text-sm"
                  placeholder="founder@quantumledger.ai"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  className="glass-input w-full pl-10 pr-3.5 py-2.5 text-sm"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <Button variant="primary" className="w-full py-2.5 text-sm">
              <span>Sign In</span>
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-emerald-400 hover:underline">
                Register here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
