import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import Button from '../components/Button'
import ErrorState from '../components/ErrorState'
import { api } from '../services/api'
import { Rocket, ArrowLeft, BrainCircuit, ShieldAlert, Sparkles } from 'lucide-react'

export default function NewStartupPage() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    tagline: '',
    industry: 'FinTech',
    stage: 'Seed',
    thesis: '',
  })

  async function onSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const created = await api.createStartup(form)
      navigate(`/startups/${created?.id || 'demo-1'}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageContainer
      title="Register New Startup"
      description="Create a startup thesis profile to submit for AI evidence verification and financial simulation."
      action={
        <Link to="/startups">
          <Button variant="ghost" className="text-xs">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Hub</span>
          </Button>
        </Link>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3 max-w-4xl">
        <div className="lg:col-span-2">
          <Card title="Startup Registration Details" hover={false}>
            {error && <ErrorState message={error} />}

            <form className="mt-4 space-y-4" onSubmit={onSubmit}>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Startup Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. QuantumLedger AI"
                  className="glass-input w-full px-3.5 py-2.5 text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  One-Line Pitch / Tagline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Autonomous AI co-pilot for institutional cross-border settlement"
                  className="glass-input w-full px-3.5 py-2.5 text-sm"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Industry Sector
                  </label>
                  <select
                    className="glass-input w-full px-3.5 py-2.5 text-sm bg-slate-900"
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  >
                    <option value="FinTech">FinTech</option>
                    <option value="HealthTech">HealthTech</option>
                    <option value="Enterprise AI">Enterprise AI</option>
                    <option value="CleanTech">CleanTech</option>
                    <option value="SaaS">SaaS</option>
                    <option value="DeepTech">DeepTech</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Funding Stage
                  </label>
                  <select
                    className="glass-input w-full px-3.5 py-2.5 text-sm bg-slate-900"
                    value={form.stage}
                    onChange={(e) => setForm({ ...form, stage: e.target.value })}
                  >
                    <option value="Pre-Seed">Pre-Seed</option>
                    <option value="Seed">Seed</option>
                    <option value="Series A">Series A</option>
                    <option value="Series B">Series B</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Investment Thesis & Founder Claims
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your revenue model, CAC assumptions, growth targets (e.g. 'Projecting 30% MoM growth with CAC of ₹300 and ₹40L annual revenue')."
                  className="glass-input w-full px-3.5 py-2.5 text-sm"
                  value={form.thesis}
                  onChange={(e) => setForm({ ...form, thesis: e.target.value })}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="primary" type="submit" disabled={loading} className="w-full sm:w-auto">
                  <Rocket className="h-4 w-4" />
                  <span>{loading ? 'Creating Startup…' : 'Submit & Create Startup'}</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* AI Guidance Sidebar */}
        <div className="space-y-4">
          <Card title="How AI Arena Processes Thesis" hover={false}>
            <ul className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Claim Extraction:</strong> Document Intelligence Agent parses text into testable metrics.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <BrainCircuit className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Financial Simulation:</strong> Python module runs Bull, Base, and Bear runway models.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Red-Team Analysis:</strong> AI challenges CAC assumptions, market size, and burn rate.
                </span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
