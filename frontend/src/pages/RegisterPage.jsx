import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import Button from '../components/Button'
import { Cpu, User, Mail, ShieldCheck, Rocket, Users } from 'lucide-react'

export default function RegisterPage() {
  const [role, setRole] = useState('startup')

  return (
    <PageContainer>
      <div className="mx-auto max-w-md py-12">
        <Card hover={false}>
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/20 text-slate-950">
              <Cpu className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-white">Create Arena Account</h2>
            <p className="mt-1 text-xs text-slate-400">
              Select your identity role for Supabase Auth + microservices sync.
            </p>
          </div>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            {/* Role Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Account Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('startup')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                    role === 'startup'
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Rocket className="h-3.5 w-3.5" />
                  <span>Startup Founder</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('investor')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                    role === 'investor'
                      ? 'bg-purple-500/15 border-purple-500/50 text-purple-400'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span>Investor / VC</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  className="glass-input w-full pl-10 pr-3.5 py-2.5 text-sm"
                  placeholder="Alex Mercer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  className="glass-input w-full pl-10 pr-3.5 py-2.5 text-sm"
                  placeholder="alex@quantumledger.ai"
                />
              </div>
            </div>

            <Button variant="primary" className="w-full py-2.5 text-sm">
              <span>Create Account</span>
            </Button>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-emerald-400 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
