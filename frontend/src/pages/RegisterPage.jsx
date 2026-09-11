import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import Button from '../components/Button'
import { useAuthContext } from '../context/AuthContext'
import api from '../services/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { signUp, createProfile } = useAuthContext()

  const [step, setStep] = useState(1) // 1: Signup & Role, 2: Role-specific onboarding
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // Step 1 State
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('startup')

  // Startup Onboarding State
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('Fintech')
  const [stage, setStage] = useState('Seed')
  const [fundingRequirement, setFundingRequirement] = useState('')
  const [businessModel, setBusinessModel] = useState('B2B SaaS')
  const [tagline, setTagline] = useState('')
  const [description, setDescription] = useState('')
  const [website, setWebsite] = useState('')
  const [thesis, setThesis] = useState('')

  // Investor Onboarding State
  const [displayName, setDisplayName] = useState('')
  const [firm, setFirm] = useState('')
  const [bio, setBio] = useState('')
  const [investorThesis, setInvestorThesis] = useState('')
  const [checkSizeMin, setCheckSizeMin] = useState('')
  const [checkSizeMax, setCheckSizeMax] = useState('')
  const [riskAppetite, setRiskAppetite] = useState('Moderate')
  const [prefIndustries, setPrefIndustries] = useState('Fintech, AI, SaaS')
  const [prefStages, setPrefStages] = useState('Seed, Series A')

  const handleStep1Submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // 1. Create Supabase Auth user
      const signUpRes = await signUp(email, password)
      
      // If session is not returned immediately, try signing in
      if (!signUpRes?.session) {
        try {
          await signIn(email, password)
        } catch (signInErr) {
          setError(
            'Account created! If email confirmation is enabled in your Supabase project, please check your email inbox to verify your account, or disable "Confirm Email" in Supabase Dashboard (Auth -> Providers -> Email).'
          )
          setLoading(false)
          return
        }
      }

      // 2. Create common user profile in backend user-service
      await createProfile({ full_name: fullName, role })
      
      // Auto-fill names for step 2 onboarding
      if (role === 'startup') {
        setCompanyName(fullName ? `${fullName}'s Startup` : '')
      } else {
        setDisplayName(fullName)
      }
      
      setStep(2)
    } catch (err) {
      console.error('Step 1 Registration Error:', err)
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleStartupOnboarding = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await api.createStartup({
        name: companyName,
        industry,
        stage,
        funding_requirement: fundingRequirement ? parseFloat(fundingRequirement) : null,
        business_model: businessModel,
        tagline,
        description,
        website,
        thesis,
      })
      navigate('/')
    } catch (err) {
      setError(err.message || 'Failed to complete startup onboarding')
    } finally {
      setLoading(false)
    }
  }

  const handleInvestorOnboarding = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const created = await api.createInvestor({
        display_name: displayName,
        firm,
        bio,
        thesis: investorThesis,
      })

      if (created?.id) {
        await api.updateInvestorPreferences(created.id, {
          industries: prefIndustries.split(',').map((s) => s.trim()).filter(Boolean),
          stages: prefStages.split(',').map((s) => s.trim()).filter(Boolean),
          check_size_min: checkSizeMin ? parseFloat(checkSizeMin) : null,
          check_size_max: checkSizeMax ? parseFloat(checkSizeMax) : null,
          risk_appetite: riskAppetite,
        })
      }
      navigate('/')
    } catch (err) {
      setError(err.message || 'Failed to complete investor onboarding')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer title="Register Account">
      <Card>
        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        {step === 1 && (
          <div>
            <h3 className="mb-2 text-lg font-bold">Step 1: Account Creation</h3>
            <p className="mb-4 text-sm text-[var(--muted)]">
              Create your account credentials and select your primary role.
            </p>

            <form className="space-y-4" onSubmit={handleStep1Submit}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Full Name</label>
                <input
                  className="w-full rounded border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Email</label>
                <input
                  className="w-full rounded border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Password</label>
                <input
                  className="w-full rounded border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Account Role</label>
                <select
                  className="w-full rounded border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="startup">Startup Founder</option>
                  <option value="investor">Investor / VC</option>
                </select>
                <p className="mt-1 text-xs text-[var(--muted)]">Note: Account role cannot be changed after registration.</p>
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Continue to Onboarding'}
              </Button>

              <p className="text-xs text-[var(--muted)] mt-2">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:underline">
                  Sign in here
                </Link>
              </p>
            </form>
          </div>
        )}

        {step === 2 && role === 'startup' && (
          <div>
            <h3 className="mb-2 text-lg font-bold">Step 2: Startup Profile Onboarding</h3>
            <p className="mb-4 text-sm text-[var(--muted)]">
              Provide information about your startup.
            </p>

            <form className="space-y-4" onSubmit={handleStartupOnboarding}>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Company Name</label>
                <input
                  className="w-full rounded border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme AI"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Industry</label>
                  <input
                    className="w-full rounded border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="Fintech"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Stage</label>
                  <input
                    className="w-full rounded border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    type="text"
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    placeholder="Seed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Funding Requirement ($)</label>
                  <input
                    className="w-full rounded border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    type="number"
                    value={fundingRequirement}
                    onChange={(e) => setFundingRequirement(e.target.value)}
                    placeholder="500000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Business Model</label>
                  <input
                    className="w-full rounded border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    type="text"
                    value={businessModel}
                    onChange={(e) => setBusinessModel(e.target.value)}
                    placeholder="B2B SaaS"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Tagline</label>
                <input
                  className="w-full rounded border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Automating financial intelligence"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Description</label>
                <textarea
                  className="w-full rounded border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed company summary..."
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? 'Saving Startup Profile...' : 'Complete Registration'}
              </Button>
            </form>
          </div>
        )}

        {step === 2 && role === 'investor' && (
          <div>
            <h3 className="mb-2 text-lg font-bold">Step 2: Investor Profile & Preferences</h3>
            <p className="mb-4 text-sm text-[var(--muted)]">
              Specify your investment thesis, check size range, and risk appetite.
            </p>

            <form className="space-y-4" onSubmit={handleInvestorOnboarding}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Display Name</label>
                  <input
                    className="w-full rounded border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Firm / Fund</label>
                  <input
                    className="w-full rounded border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    type="text"
                    value={firm}
                    onChange={(e) => setFirm(e.target.value)}
                    placeholder="Acme Ventures"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Bio</label>
                <input
                  className="w-full rounded border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Early-stage venture investor in AI & Fintech"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Min Check ($)</label>
                  <input
                    className="w-full rounded border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    type="number"
                    value={checkSizeMin}
                    onChange={(e) => setCheckSizeMin(e.target.value)}
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Max Check ($)</label>
                  <input
                    className="w-full rounded border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    type="number"
                    value={checkSizeMax}
                    onChange={(e) => setCheckSizeMax(e.target.value)}
                    placeholder="500000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Risk Appetite</label>
                  <select
                    className="w-full rounded border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-blue-500 bg-white"
                    value={riskAppetite}
                    onChange={(e) => setRiskAppetite(e.target.value)}
                  >
                    <option value="Conservative">Conservative</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High / Aggressive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-1">Preferred Industries (comma separated)</label>
                <input
                  className="w-full rounded border border-black/15 px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  type="text"
                  value={prefIndustries}
                  onChange={(e) => setPrefIndustries(e.target.value)}
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? 'Saving Investor Profile...' : 'Complete Registration'}
              </Button>
            </form>
          </div>
        )}
      </Card>
    </PageContainer>
  )
}
