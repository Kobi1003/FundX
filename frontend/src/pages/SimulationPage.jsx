import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Calculator,
  Calendar,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  DollarSign,
  Flame,
  FlaskConical,
  HelpCircle,
  Info,
  Layers,
  LineChart as LineChartIcon,
  LoaderCircle,
  Percent,
  Play,
  RefreshCw,
  Rocket,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Upload,
  Wrench,
  Zap
} from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'
import { api } from '../services/api'

// India-market B2B SaaS seed defaults (aligned to 2025–26 Indian SaaS benchmarks:
// ~₹10L–₹1Cr ARR stage, CAC ₹10–25k, churn 3–5%/mo, GM 60–70%, seed cash ₹1.5–4Cr)
const initialForm = {
  company_name: 'Ledgerly',
  industry: 'India-market B2B FinTech SaaS',
  stage: 'Seed (raising pre-Series A)',
  current_mrr: 400000, // ₹4L MRR → ₹48L ARR (strong seed / pre-A band)
  funding: 25000000, // ₹2.5Cr cash after typical seed raise
  current_customers: 80, // 80 logos × ₹5k ARPU = ₹4L MRR
  pricing: 5000, // ₹5,000/mo ≈ ₹60k ACV (typical India SMB SaaS)
  cac: 18000, // blended CAC mid-benchmark (₹10k–₹25k)
  marketing_spend: 180000, // ≈10 paid customers / month at ₹18k CAC
  growth_rate: 1.0, // 100% YoY (~2×) — Series A trajectory, not fairy-tale
  churn: 0.035, // 3.5% monthly logo churn (India SMB band 3–5%)
  starting_gross_margin: 0.68, // 68% SaaS GM (benchmark 60–70%)
  operating_expenses: 600000, // ₹6L fixed opex (~8-person early team)
  growth_decay_rate: 0.015, // mild deceleration of growth efficiency
  months: 18,
  investment_amount: 0, // off by default so Starting Cash visibly drives runway/ending cash
  equity_percentage: 0.18,
  investment_month: 6,
  valuation_multiple: 10, // India seed/Series A ARR multiples ~6–12× / 8–18×
  use_historical_data: false,
  historical_growth_rates_str: '0.12, 0.18, 0.15, 0.20, 0.14, 0.16',
  historical_cac_str: '16000, 18000, 19000, 17000, 21000, 18500',
  historical_churn_str: '0.032, 0.038, 0.035, 0.040, 0.033',
}

const formatMoney = (value) => {
  const num = Number(value || 0)
  if (Math.abs(num) >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`
  }
  if (Math.abs(num) >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`
  }
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(num)
}

const formatNumber = (value) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(value || 0))

const formatPercent = (val) => `${(Number(val || 0) * 100).toFixed(1)}%`

/**
 * Interactive Multi-Scenario SVG Line Chart
 * Consumes pure backend deterministic output.
 */
function MultiScenarioChart({ scenarios, metric = 'arr', title, unit = '₹' }) {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const [visibleScenarios, setVisibleScenarios] = useState({ bull: true, base: true, bear: true })

  const bullForecast = scenarios.bull?.monthly_forecast || []
  const baseForecast = scenarios.base?.monthly_forecast || []
  const bearForecast = scenarios.bear?.monthly_forecast || []
  const monthsCount = Math.max(bullForecast.length, baseForecast.length, bearForecast.length, 1)

  // Construct series data starting from Month 0 baseline
  const getDataSeries = (forecast, scenarioName) => {
    if (!forecast.length) return []
    const s = scenarios[scenarioName] || {}
    let startVal = 0

    if (metric === 'arr') {
      startVal = (s.starting_mrr || 0) * 12
    } else if (metric === 'mrr') {
      startVal = s.starting_mrr || 0
    } else if (metric === 'ending_cash') {
      startVal = s.starting_cash || 0
    } else if (metric === 'ending_customers') {
      startVal = s.starting_customers || 0
    } else if (metric === 'operating_profit') {
      // True Month-0 OP: starting MRR × margin − (fixed + marketing)
      const margin = forecast[0]?.gross_margin ?? 0.75
      const fixed = forecast[0]?.fixed_costs ?? 0
      const marketing = forecast[0]?.marketing_spend ?? 0
      startVal = (s.starting_mrr || 0) * margin - (fixed + marketing)
    } else {
      startVal = forecast[0]?.[metric] || 0
    }

    const initialPoint = { month: 0, val: startVal }
    const points = forecast.map((f) => ({ month: f.month, val: f[metric] ?? 0 }))
    return [initialPoint, ...points]
  }

  const bullData = getDataSeries(bullForecast, 'bull')
  const baseData = getDataSeries(baseForecast, 'base')
  const bearData = getDataSeries(bearForecast, 'bear')

  // Calculate global min and max across visible series
  const allValues = [
    ...(visibleScenarios.bull ? bullData.map((d) => d.val) : []),
    ...(visibleScenarios.base ? baseData.map((d) => d.val) : []),
    ...(visibleScenarios.bear ? bearData.map((d) => d.val) : []),
  ]

  const maxVal = allValues.length ? Math.max(...allValues, 0) : 100
  const minVal = allValues.length ? Math.min(...allValues, 0) : 0
  const rawRange = maxVal - minVal || 1
  const paddedMax = maxVal + rawRange * 0.08
  const paddedMin = minVal < 0 ? minVal - rawRange * 0.08 : 0
  const range = paddedMax - paddedMin || 1

  const width = 800
  const height = 220
  const padding = { top: 12, right: 24, bottom: 28, left: 56 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const getX = (mIdx) => padding.left + (mIdx / monthsCount) * chartWidth
  const getY = (val) => padding.top + chartHeight - ((val - paddedMin) / range) * chartHeight

  const generatePath = (data) => {
    if (!data.length) return ''
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(d.month)} ${getY(d.val)}`).join(' ')
  }

  const zeroY = getY(0)
  const isZeroVisible = paddedMin < 0 && paddedMax > 0

  const toggleScenario = (name) => {
    setVisibleScenarios((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  const activeIndex = hoveredIdx !== null ? Math.min(hoveredIdx, monthsCount) : null

  return (
    <div className="relative rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
      {/* Header & Legends */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="text-[11px] text-slate-500">Bull / Base / Bear from identical Month 0</p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => toggleScenario('bull')}
            className={`flex items-center gap-1.5 transition ${visibleScenarios.bull ? 'text-emerald-700 opacity-100' : 'text-slate-400 opacity-50'}`}
          >
            <span className="inline-block h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
            <span>Bull Case</span>
          </button>
          <button
            onClick={() => toggleScenario('base')}
            className={`flex items-center gap-1.5 transition ${visibleScenarios.base ? 'text-sky-700 opacity-100' : 'text-slate-400 opacity-50'}`}
          >
            <span className="inline-block h-3 w-3 rounded-full bg-sky-500 ring-2 ring-sky-200" />
            <span>Base Case</span>
          </button>
          <button
            onClick={() => toggleScenario('bear')}
            className={`flex items-center gap-1.5 transition ${visibleScenarios.bear ? 'text-rose-700 opacity-100' : 'text-slate-400 opacity-50'}`}
          >
            <span className="inline-block h-3 w-3 rounded-full bg-rose-500 ring-2 ring-rose-200" />
            <span>Bear Case</span>
          </button>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-44 w-full max-h-[36vh] select-none overflow-visible"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left
            const relX = (x / rect.width) * width - padding.left
            const monthVal = Math.round((relX / chartWidth) * monthsCount)
            if (monthVal >= 0 && monthVal <= monthsCount) {
              setHoveredIdx(monthVal)
            }
          }}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = padding.top + chartHeight * pct
            const val = paddedMax - pct * range
            return (
              <g key={pct}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-medium"
                >
                  {unit === '₹' ? formatMoney(val) : formatNumber(val)}
                </text>
              </g>
            )
          })}

          {/* Zero threshold line */}
          {isZeroVisible && (
            <g>
              <line
                x1={padding.left}
                y1={zeroY}
                x2={width - padding.right}
                y2={zeroY}
                stroke="#f43f5e"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <text
                x={width - padding.right + 4}
                y={zeroY + 3}
                className="fill-rose-500 text-[9px] font-bold"
              >
                ₹0 Threshold
              </text>
            </g>
          )}

          {/* X Axis ticks */}
          {Array.from({ length: 5 }).map((_, i) => {
            const m = Math.round((i / 4) * monthsCount)
            const x = getX(m)
            return (
              <g key={i}>
                <line x1={x} y1={padding.top + chartHeight} x2={x} y2={padding.top + chartHeight + 6} stroke="#cbd5e1" strokeWidth="1" />
                <text
                  x={x}
                  y={padding.top + chartHeight + 18}
                  textAnchor="middle"
                  className="fill-slate-500 text-[10px] font-semibold"
                >
                  M{m}
                </text>
              </g>
            )
          })}

          {/* Bear Curve */}
          {visibleScenarios.bear && bearData.length > 0 && (
            <path d={generatePath(bearData)} fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Base Curve */}
          {visibleScenarios.base && baseData.length > 0 && (
            <path d={generatePath(baseData)} fill="none" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Bull Curve */}
          {visibleScenarios.bull && bullData.length > 0 && (
            <path d={generatePath(bullData)} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Hover Crosshair */}
          {activeIndex !== null && (
            <g>
              <line
                x1={getX(activeIndex)}
                y1={padding.top}
                x2={getX(activeIndex)}
                y2={padding.top + chartHeight}
                stroke="#64748b"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              {visibleScenarios.bull && bullData[activeIndex] && (
                <circle cx={getX(activeIndex)} cy={getY(bullData[activeIndex].val)} r="5" className="fill-emerald-500 stroke-white stroke-2" />
              )}
              {visibleScenarios.base && baseData[activeIndex] && (
                <circle cx={getX(activeIndex)} cy={getY(baseData[activeIndex].val)} r="5" className="fill-sky-500 stroke-white stroke-2" />
              )}
              {visibleScenarios.bear && bearData[activeIndex] && (
                <circle cx={getX(activeIndex)} cy={getY(bearData[activeIndex].val)} r="5" className="fill-rose-500 stroke-white stroke-2" />
              )}
            </g>
          )}
        </svg>

        {/* Hover Tooltip */}
        {activeIndex !== null && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-xl border border-slate-700 bg-slate-900/95 p-3 text-xs text-white shadow-xl backdrop-blur-md"
            style={{
              left: `${((getX(activeIndex)) / width) * 100}%`,
              top: '10px',
            }}
          >
            <div className="mb-1.5 font-bold text-slate-300">
              {activeIndex === 0 ? 'Month 0 (Baseline)' : `Month ${activeIndex}`}
            </div>
            <div className="space-y-1">
              {visibleScenarios.bull && bullData[activeIndex] && (
                <div className="flex items-center justify-between gap-3 text-emerald-400 font-semibold">
                  <span>🚀 Bull:</span>
                  <span>{unit === '₹' ? formatMoney(bullData[activeIndex].val) : formatNumber(bullData[activeIndex].val)}</span>
                </div>
              )}
              {visibleScenarios.base && baseData[activeIndex] && (
                <div className="flex items-center justify-between gap-3 text-sky-300 font-semibold">
                  <span>🟡 Base:</span>
                  <span>{unit === '₹' ? formatMoney(baseData[activeIndex].val) : formatNumber(baseData[activeIndex].val)}</span>
                </div>
              )}
              {visibleScenarios.bear && bearData[activeIndex] && (
                <div className="flex items-center justify-between gap-3 text-rose-400 font-semibold">
                  <span>🔴 Bear:</span>
                  <span>{unit === '₹' ? formatMoney(bearData[activeIndex].val) : formatNumber(bearData[activeIndex].val)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, name, value, onChange, suffix, step = 'any', tooltip }) {
  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between">
        <span className="sim-field-label text-[11px] font-bold" style={{ color: '#0f172a' }}>
          {label}
        </span>
        {tooltip && (
          <span title={tooltip} className="cursor-help" style={{ color: '#475569' }}>
            <HelpCircle className="h-3 w-3" />
          </span>
        )}
      </div>
      <div className="relative">
        <input
          className="w-full rounded-lg border px-2.5 py-1.5 text-sm font-bold outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          style={{ color: '#0f172a', background: '#ffffff', borderColor: '#94a3b8' }}
          type="number"
          name={name}
          value={value}
          step={step}
          onChange={onChange}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-2 text-xs font-bold" style={{ color: '#334155' }}>
            {suffix}
          </span>
        )}
      </div>
    </label>
  )
}

export default function SimulationPage() {
  const location = useLocation()
  const [form, setForm] = useState(initialForm)
  const [result, setResult] = useState(null)
  const [sensitivity, setSensitivity] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeGraphTab, setActiveGraphTab] = useState('arr')
  const [activeTableScenario, setActiveTableScenario] = useState('base')
  const [advanced, setAdvanced] = useState(false)
  const [caseType, setCaseType] = useState('claimed')
  const [thesisText, setThesisText] = useState('')
  const [thesisFileName, setThesisFileName] = useState('')
  const [futureAnalysis, setFutureAnalysis] = useState(null)
  const [analyzingThesis, setAnalyzingThesis] = useState(false)
  const [thesisHydrated, setThesisHydrated] = useState(false)
  const thesisFileRef = useRef(null)

  // Month-0 Consistency Calculation
  const reportedMRR = Number(form.current_mrr || 0)
  const customersCount = Number(form.current_customers || 0)
  const arpuValue = Number(form.pricing || 0)
  const impliedMRR = customersCount * arpuValue
  const discrepancyPct =
    impliedMRR > 0 && reportedMRR > 0
      ? (Math.abs(reportedMRR - impliedMRR) / impliedMRR) * 100
      : 0
  const hasInconsistency = discrepancyPct > 5.0 && Math.abs(reportedMRR - impliedMRR) > 100

  // Annual to monthly compounding equivalent: g_m = (1 + g_a)^(1/12) - 1
  const annualGrowth = Number(form.growth_rate || 0)
  const monthlyGrowthEquivalent = annualGrowth > -1 ? Math.pow(1 + annualGrowth, 1 / 12) - 1 : 0

  const parseSeries = (str) =>
    str
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n))

  const payload = useMemo(() => {
    const historicalGrowth = form.use_historical_data ? parseSeries(form.historical_growth_rates_str) : []
    const historicalCac = form.use_historical_data ? parseSeries(form.historical_cac_str) : []
    const historicalChurn = form.use_historical_data ? parseSeries(form.historical_churn_str) : []

    return {
      company_name: form.company_name,
      industry: form.industry,
      stage: form.stage,
      current_mrr: Number(form.current_mrr),
      current_customers: Number(form.current_customers),
      pricing: Number(form.pricing),
      cac: Number(form.cac),
      churn: Number(form.churn),
      starting_gross_margin: Number(form.starting_gross_margin),
      funding: Number(form.funding),
      starting_cash: Number(form.funding),
      operating_expenses: Number(form.operating_expenses),
      marketing_spend: Number(form.marketing_spend),
      growth_rate: Number(form.growth_rate),
      growth_decay_rate: Number(form.growth_decay_rate),
      months: Number(form.months),
      valuation_multiple: Number(form.valuation_multiple || 8),
      // Blended engine: Bull/Base/Bear ∝ Starting MRR, Customers×ARPU, Cash; ∝ 1/CAC.
      authoritative_mrr_basis: 'reported_mrr',
      simulation_case: caseType,
      historical_growth_rates: historicalGrowth,
      historical_cac: historicalCac,
      historical_churn_rates: historicalChurn,
      funding_round:
        Number(form.investment_amount) > 0
          ? {
              investment_amount: Number(form.investment_amount),
              equity_percentage: Number(form.equity_percentage),
              investment_month: Number(form.investment_month),
            }
          : null,
    }
  }, [form, caseType])

  const update = (event) => {
    const { name, type, checked, value } = event.target
    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }
  const runSimulation = useCallback(async (overridePayload) => {
    setLoading(true)
    setError(null)
    try {
      const body = overridePayload || payload
      const [scenarioResponse, sensitivityResponse] = await Promise.all([
        api.runSimulationScenarios(body),
        api.runSimulationSensitivity(body),
      ])
      setResult(scenarioResponse)
      setSensitivity(sensitivityResponse.sensitivity || [])
    } catch (err) {
      setError(err.message || 'Unable to run the simulation.')
    } finally {
      setLoading(false)
    }
  }, [payload])

  const applyThesisResult = useCallback(
    (res) => {
      if (res?.simulator_form) {
        setForm((prev) => ({ ...prev, ...res.simulator_form }))
      } else if (res?.extracted_assumptions) {
        const a = res.extracted_assumptions
        setForm((prev) => ({
          ...prev,
          company_name: a.company_name || prev.company_name,
          industry: a.industry || prev.industry,
          stage: a.stage || prev.stage,
          current_mrr: a.current_mrr ?? prev.current_mrr,
          funding: a.funding ?? prev.funding,
          current_customers: a.current_customers ?? prev.current_customers,
          pricing: a.pricing ?? prev.pricing,
          cac: a.cac ?? prev.cac,
          churn: a.churn ?? prev.churn,
          marketing_spend: a.marketing_spend ?? prev.marketing_spend,
          growth_rate: a.growth_rate ?? prev.growth_rate,
          starting_gross_margin: a.starting_gross_margin ?? prev.starting_gross_margin,
          operating_expenses: a.operating_expenses ?? prev.operating_expenses,
          months: a.months ?? prev.months,
          valuation_multiple: a.valuation_multiple ?? prev.valuation_multiple,
        }))
      }
      if (res?.future_analysis) setFutureAnalysis(res.future_analysis)
      if (res?.scenarios) {
        setResult({
          scenarios: res.scenarios,
          summary: res.simulation_detail?.summary || {
            red_team_analysis: { summary: res.insights },
          },
          ...(res.simulation_detail || {}),
        })
      }
      if (res?.sensitivity) setSensitivity(res.sensitivity)
    },
    [],
  )

  const analyzeThesisAndSimulate = useCallback(async () => {
    if (!thesisText.trim()) {
      setError('Paste a thesis or upload a thesis PDF before running Analyze & Simulate.')
      return
    }
    setAnalyzingThesis(true)
    setError(null)
    try {
      const res = await api.analyzeThesis({
        thesis_text: thesisText,
        pitch: form.company_name,
        industry: form.industry,
        funding_stage: form.stage,
        company_name: form.company_name,
        amount: form.funding,
        run_full_simulation: true,
      })
      applyThesisResult(res)
      if (res?.simulator_form) {
        const next = { ...form, ...res.simulator_form }
        const body = {
          company_name: next.company_name,
          industry: next.industry,
          stage: next.stage,
          current_mrr: Number(next.current_mrr),
          current_customers: Number(next.current_customers),
          pricing: Number(next.pricing),
          cac: Number(next.cac),
          churn: Number(next.churn),
          starting_gross_margin: Number(next.starting_gross_margin),
          funding: Number(next.funding),
          starting_cash: Number(next.funding),
          operating_expenses: Number(next.operating_expenses),
          marketing_spend: Number(next.marketing_spend),
          growth_rate: Number(next.growth_rate),
          growth_decay_rate: Number(next.growth_decay_rate || 0.015),
          months: Number(next.months),
          valuation_multiple: Number(next.valuation_multiple || 8),
          authoritative_mrr_basis: 'reported_mrr',
          simulation_case: caseType,
        }
        await runSimulation(body)
      }
    } catch (err) {
      setError(err.message || 'Thesis analysis failed.')
    } finally {
      setAnalyzingThesis(false)
    }
  }, [thesisText, form, caseType, applyThesisResult, runSimulation])

  const analyzeThesisFile = useCallback(
    async (file) => {
      if (!file) return
      setAnalyzingThesis(true)
      setError(null)
      setThesisFileName(file.name)
      try {
        const res = await api.analyzeThesisUpload(file, {
          company_name: form.company_name,
          industry: form.industry,
          funding_stage: form.stage,
          amount: form.funding,
          run_full_simulation: true,
        })
        if (res?.extracted_text_preview) {
          setThesisText(res.extracted_text_preview)
        }
        applyThesisResult(res)
        if (res?.simulator_form) {
          const next = { ...form, ...res.simulator_form }
          await runSimulation({
            company_name: next.company_name,
            industry: next.industry,
            stage: next.stage,
            current_mrr: Number(next.current_mrr),
            current_customers: Number(next.current_customers),
            pricing: Number(next.pricing),
            cac: Number(next.cac),
            churn: Number(next.churn),
            starting_gross_margin: Number(next.starting_gross_margin),
            funding: Number(next.funding),
            starting_cash: Number(next.funding),
            operating_expenses: Number(next.operating_expenses),
            marketing_spend: Number(next.marketing_spend),
            growth_rate: Number(next.growth_rate),
            growth_decay_rate: Number(next.growth_decay_rate || 0.015),
            months: Number(next.months),
            valuation_multiple: Number(next.valuation_multiple || 8),
            authoritative_mrr_basis: 'reported_mrr',
            simulation_case: caseType,
          })
        }
      } catch (err) {
        setError(err.message || 'Thesis PDF analysis failed.')
      } finally {
        setAnalyzingThesis(false)
      }
    },
    [form, caseType, applyThesisResult, runSimulation],
  )

  // Debounced auto-recalculation when inputs change
  useEffect(() => {
    if (!result) return undefined
    const timer = window.setTimeout(() => {
      runSimulation()
    }, 600)
    return () => window.clearTimeout(timer)
  }, [payload]) // eslint-disable-line react-hooks/exhaustive-deps

  // Optional deep-link: /simulation?thesisDoc=AeroGrid_Investment_Thesis_Q3.pdf
  useEffect(() => {
    const params = new URLSearchParams(location.search || '')
    const doc = params.get('thesisDoc')
    if (!doc || thesisHydrated) return
    setThesisHydrated(true)
    const url = `/theses/${encodeURIComponent(doc.replace(/^.*[\\/]/, ''))}`
    ;(async () => {
      try {
        const resp = await fetch(url)
        if (!resp.ok) throw new Error(`Thesis PDF not found: ${doc}`)
        const blob = await resp.blob()
        const file = new File([blob], doc.replace(/^.*[\\/]/, ''), { type: 'application/pdf' })
        await analyzeThesisFile(file)
      } catch (err) {
        setError(err.message || 'Could not load thesis PDF')
      }
    })()
  }, [location.search, thesisHydrated, analyzeThesisFile])

  // Hydrate from create-deal / deep-link state once
  useEffect(() => {
    const state = location.state
    if (!state || thesisHydrated) return
    setThesisHydrated(true)
    if (state.thesis) setThesisText(state.thesis)
    if (state.futureAnalysis) setFutureAnalysis(state.futureAnalysis)
    if (state.assumptions || state.simulatorForm || state.aiReport) {
      const pack = state.aiReport || {
        simulator_form: state.simulatorForm,
        extracted_assumptions: state.assumptions,
        future_analysis: state.futureAnalysis,
        scenarios: state.scenarios,
        sensitivity: state.sensitivity,
        simulation_detail: state.simulationDetail,
        insights: state.insights,
      }
      applyThesisResult(pack)
    }
    const t = window.setTimeout(() => runSimulation(), 50)
    return () => window.clearTimeout(t)
  }, [location.state, thesisHydrated, applyThesisResult, runSimulation])

  useEffect(() => {
    if (location.state?.fromThesis) return
    runSimulation()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const scenarios = result?.scenarios || {}
  const bull = scenarios.bull
  const base = scenarios.base
  const bear = scenarios.bear
  const redTeam = result?.summary?.red_team_analysis

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
      <div className="shrink-0 rounded-xl bg-gradient-to-r from-[#0c2a21] via-[#104334] to-[#175c46] px-4 py-3 text-white shadow-md">
        <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
          <div className="min-w-0">
            <div className="mb-0.5 flex flex-wrap items-center gap-2 text-emerald-300">
              <FlaskConical className="h-4 w-4 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Deterministic Engine · India SaaS benchmarks
              </span>
            </div>
            <h1 className="truncate text-lg font-black md:text-xl">Financial Scenario Simulator</h1>
            <p className="mt-0.5 max-w-3xl text-[11px] leading-snug text-emerald-100/85">
              Defaults mirror India-market B2B SaaS seed economics (≈₹48L ARR, CAC ₹10–25k, churn 3–5%/mo, GM 60–70%).
              Starting MRR and Cash are independent inputs · Bull/Base/Bear share Month 0.
            </p>
          </div>
          <Button
            onClick={() => runSimulation()}
            disabled={loading || analyzingThesis}
            className="shrink-0 bg-amber-400 font-bold text-slate-950 shadow-md hover:bg-amber-300"
          >
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {loading ? 'Running…' : 'Recalculate'}
          </Button>
        </div>
      </div>

      {hasInconsistency && (
        <div className="shrink-0 rounded-xl border border-rose-400 bg-rose-50 px-3 py-2 text-rose-950">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold leading-snug">
              MRR {formatMoney(reportedMRR)} ≠ Customers × ARPU {formatMoney(impliedMRR)} ({discrepancyPct.toFixed(1)}%).
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, current_mrr: impliedMRR }))}
                className="rounded-lg bg-rose-600 px-2.5 py-1 text-[10px] font-bold text-white"
              >
                Use × ARPU
              </button>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    pricing: customersCount > 0 ? reportedMRR / customersCount : prev.pricing,
                  }))
                }
                className="rounded-lg border border-rose-300 bg-white px-2.5 py-1 text-[10px] font-bold text-rose-800"
              >
                Adjust ARPU
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="min-h-0 space-y-3 overflow-y-auto overscroll-contain pr-1">
          <section className="sim-drivers-panel p-4">
            <div className="mb-3 border-b border-slate-200 pb-2">
              <h2 className="text-base font-bold" style={{ color: '#0f172a' }}>
                Thesis → Future Analysis
              </h2>
              <p className="sim-panel-subtitle mt-0.5 text-xs font-semibold" style={{ color: '#334155' }}>
                Upload a deal thesis PDF (or paste text). ADK / Gemini extracts drivers; Python simulates.
              </p>
            </div>
            <input
              ref={thesisFileRef}
              type="file"
              accept="application/pdf,.pdf,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) analyzeThesisFile(f)
                e.target.value = ''
              }}
            />
            <button
              type="button"
              onClick={() => thesisFileRef.current?.click()}
              disabled={analyzingThesis || loading}
              className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-2 text-xs font-bold hover:bg-slate-50 disabled:opacity-50"
              style={{ color: '#0f172a', borderColor: '#94a3b8' }}
            >
              <Upload className="h-3.5 w-3.5" />
              {thesisFileName ? `Uploaded: ${thesisFileName}` : 'Upload thesis PDF'}
            </button>
            <textarea
              value={thesisText}
              onChange={(e) => setThesisText(e.target.value)}
              rows={4}
              placeholder="Or paste investment thesis text here…"
              className="mb-2 w-full rounded-lg border px-2.5 py-2 text-xs font-medium outline-none focus:border-emerald-600"
              style={{ color: '#0f172a', background: '#ffffff', borderColor: '#94a3b8' }}
            />
            <button
              type="button"
              onClick={analyzeThesisAndSimulate}
              disabled={analyzingThesis || loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {analyzingThesis ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
              {analyzingThesis ? 'Extracting drivers…' : 'Analyze & Simulate'}
            </button>
          </section>

          <section className="sim-drivers-panel p-4">
            <div className="mb-3 border-b border-slate-200 pb-2">
              <h2 className="text-base font-bold" style={{ color: '#0f172a' }}>
                Operating Drivers
              </h2>
              <p className="sim-panel-subtitle mt-0.5 text-xs font-semibold" style={{ color: '#334155' }}>
                India seed-stage defaults · raw INR
              </p>
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className="sim-field-label mb-1 block text-[11px] font-bold" style={{ color: '#0f172a' }}>
                  Company Name
                </span>
                <input
                  name="company_name"
                  value={form.company_name}
                  onChange={update}
                  className="w-full rounded-lg border px-2.5 py-1.5 text-sm font-bold outline-none focus:border-emerald-600"
                  style={{ color: '#0f172a', background: '#ffffff', borderColor: '#94a3b8' }}
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Starting MRR" name="current_mrr" value={form.current_mrr} onChange={update} suffix="₹" tooltip="Month-0 recurring revenue (independent of Customers × ARPU)" />
                <Field label="Starting Cash" name="funding" value={form.funding} onChange={update} suffix="₹" tooltip="Liquid cash at Month 0 (never overwritten)" />
                <Field label="Customers" name="current_customers" value={form.current_customers} onChange={update} tooltip="Paying logos at Month 0" />
                <Field label="ARPU / mo" name="pricing" value={form.pricing} onChange={update} suffix="₹" tooltip="Avg revenue per customer / month" />
                <Field label="CAC" name="cac" value={form.cac} onChange={update} suffix="₹" tooltip="Blended customer acquisition cost" />
                <Field label="Marketing / mo" name="marketing_spend" value={form.marketing_spend} onChange={update} suffix="₹" tooltip="Monthly acquisition budget" />
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-2">
                <div>
                  <Field
                    label="Claimed YoY Growth"
                    name="growth_rate"
                    value={form.growth_rate}
                    onChange={update}
                    step="0.05"
                    suffix="dec"
                    tooltip="Converted to monthly organic adds: (1+g)^(1/12)−1"
                  />
                  <div className="mt-0.5 text-[10px] font-bold text-emerald-800">
                    gₘ ≈ {(monthlyGrowthEquivalent * 100).toFixed(2)}%/mo
                  </div>
                  {base?.simulated_annual_growth != null && (
                    <div className="text-[10px] font-bold text-black/70">
                      Sim. CAGR: {(Number(base.simulated_annual_growth) * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
                <Field label="Monthly Churn" name="churn" value={form.churn} onChange={update} suffix="dec" step="0.005" tooltip="India SMB SaaS often 3–5%/mo" />
                <Field label="Gross Margin" name="starting_gross_margin" value={form.starting_gross_margin} onChange={update} suffix="dec" step="0.01" />
                <Field label="Fixed Costs" name="operating_expenses" value={form.operating_expenses} onChange={update} suffix="₹" />
              </div>

              <p
                className="rounded-lg px-2.5 py-1.5 text-[10px] font-semibold leading-snug"
                style={{ background: '#ecfdf5', color: '#0f172a' }}
              >
                Bull / Base / Bear move with Starting MRR, Starting Cash, and Customers; higher CAC reduces paid acquisition.
                Form fields are not auto-overwritten. Leave Round Size at ₹0 unless you model a raise.
              </p>
              <p
                className="rounded-lg px-2.5 py-1.5 text-[10px] font-semibold leading-snug"
                style={{ background: '#f1f5f9', color: '#0f172a' }}
              >
                Benchmarks: India B2B SaaS seed ≈ ₹10L–₹1Cr ARR · CAC ₹10–25k · churn 3–5% · GM 60–70% · seed cash ₹1.5–4Cr.
              </p>

              <button
                type="button"
                onClick={() => setAdvanced(!advanced)}
                className="flex w-full items-center justify-between border-t border-slate-200 pt-2 text-xs font-bold"
                style={{ color: '#065f46' }}
              >
                <span>Horizon & Financing</span>
                <ChevronDown className={`h-4 w-4 transition ${advanced ? 'rotate-180' : ''}`} />
              </button>

              {advanced && (
                <div className="space-y-2 rounded-xl border border-slate-200 p-2.5" style={{ background: '#f8fafc' }}>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Horizon" name="months" value={form.months} onChange={update} suffix="mo" step="1" />
                    <Field label="Growth Decay" name="growth_decay_rate" value={form.growth_decay_rate} onChange={update} step="0.005" />
                    <Field label="Round Size" name="investment_amount" value={form.investment_amount} onChange={update} suffix="₹" />
                    <Field label="Equity" name="equity_percentage" value={form.equity_percentage} onChange={update} step="0.01" />
                    <Field label="Invest Month" name="investment_month" value={form.investment_month} onChange={update} step="1" suffix="mo" />
                    <Field label="ARR Multiple" name="valuation_multiple" value={form.valuation_multiple ?? 10} onChange={update} step="0.5" />
                  </div>
                  <label className="flex items-center justify-between text-xs font-bold" style={{ color: '#0f172a' }}>
                    Input Mode
                    <select
                      value={caseType}
                      onChange={(e) => setCaseType(e.target.value)}
                      className="rounded border px-2 py-1 font-bold"
                      style={{ color: '#0f172a', background: '#ffffff', borderColor: '#94a3b8' }}
                    >
                      <option value="claimed">Claimed</option>
                      <option value="verified">Verified</option>
                    </select>
                  </label>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="flex min-h-0 min-w-0 flex-col gap-2 overflow-hidden">
          {error && (
            <div className="flex shrink-0 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading && !result && (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-2xl bg-white p-8 text-center shadow-xs">
              <LoaderCircle className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="mt-3 text-sm font-bold text-slate-800">Running simulation…</p>
            </div>
          )}

          {result && (
            <div className={`min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1 pb-3 ${loading ? 'opacity-60' : ''}`}>
              <div className="grid gap-2 md:grid-cols-3">
                {bull && (
                  <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-800">
                        <Rocket className="h-3 w-3" /> Bull
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700">{bull.runway_display}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">{form.months}M Ending ARR</p>
                    <p className="text-xl font-black text-slate-900">{formatMoney(bull.ending_arr)}</p>
                    <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
                      <div>
                        <span className="text-slate-500">Cash</span>
                        <p className={`font-bold ${bull.ending_cash < 0 ? 'text-rose-600' : 'text-slate-800'}`}>{formatMoney(bull.ending_cash)}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Customers</span>
                        <p className="font-bold text-slate-800">{formatNumber(bull.ending_customers)}</p>
                      </div>
                    </div>
                  </div>
                )}
                {base && (
                  <div className="rounded-xl border border-sky-500/30 bg-gradient-to-b from-sky-500/10 to-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-black uppercase text-sky-800">
                        <Scale className="h-3 w-3" /> Base
                      </span>
                      <span className="text-[10px] font-bold text-sky-700">{base.runway_display}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">{form.months}M Ending ARR</p>
                    <p className="text-xl font-black text-slate-900">{formatMoney(base.ending_arr)}</p>
                    <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
                      <div>
                        <span className="text-slate-500">Cash</span>
                        <p className={`font-bold ${base.ending_cash < 0 ? 'text-rose-600' : 'text-slate-800'}`}>{formatMoney(base.ending_cash)}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Customers</span>
                        <p className="font-bold text-slate-800">{formatNumber(base.ending_customers)}</p>
                      </div>
                    </div>
                  </div>
                )}
                {bear && (
                  <div className="rounded-xl border border-rose-500/30 bg-gradient-to-b from-rose-500/10 to-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black uppercase text-rose-800">
                        <TrendingDown className="h-3 w-3" /> Bear
                      </span>
                      <span className="text-[10px] font-bold text-rose-700">{bear.runway_display}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">{form.months}M Ending ARR</p>
                    <p className="text-xl font-black text-slate-900">{formatMoney(bear.ending_arr)}</p>
                    <div className="mt-2 grid grid-cols-2 gap-1 text-[10px]">
                      <div>
                        <span className="text-slate-500">Cash</span>
                        <p className={`font-bold ${bear.ending_cash < 0 ? 'text-rose-600' : 'text-slate-800'}`}>{formatMoney(bear.ending_cash)}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Customers</span>
                        <p className="font-bold text-slate-800">{formatNumber(bear.ending_customers)}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {futureAnalysis && (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <h3 className="text-sm font-black text-slate-900">Thesis Future Analysis</h3>
                    {futureAnalysis.feasibility?.score != null && (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-black text-emerald-800">
                        Feasibility {futureAnalysis.feasibility.score}/100 · {futureAnalysis.feasibility.grade}
                      </span>
                    )}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-wide text-slate-500">Competition</p>
                      <p className="text-xs leading-relaxed text-slate-800">{futureAnalysis.competition?.summary || '—'}</p>
                      {futureAnalysis.competition?.moat && (
                        <p className="mt-2 text-[11px] font-semibold text-emerald-900">Moat: {futureAnalysis.competition.moat}</p>
                      )}
                      {(futureAnalysis.competition?.competitors || []).length > 0 && (
                        <ul className="mt-2 list-disc pl-4 text-[11px] text-slate-600">
                          {futureAnalysis.competition.competitors.map((c) => (
                            <li key={c}>{c}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-wide text-slate-500">Feasibility</p>
                      <ul className="space-y-1 text-[11px] text-emerald-900">
                        {(futureAnalysis.feasibility?.strengths || []).map((s) => (
                          <li key={s}>+ {s}</li>
                        ))}
                      </ul>
                      <ul className="mt-2 space-y-1 text-[11px] text-rose-800">
                        {(futureAnalysis.feasibility?.risks || []).map((r) => (
                          <li key={r}>− {r}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-wide text-slate-500">Market trend</p>
                      <p className="text-xs text-slate-800">{futureAnalysis.market_trend?.trend || '—'}</p>
                      <p className="mt-1 text-[11px] text-slate-600">{futureAnalysis.market_trend?.tam_sam_som}</p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-700">{futureAnalysis.market_trend?.timing}</p>
                    </div>
                    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <p className="mb-1 text-[10px] font-black uppercase tracking-wide text-slate-500">Expected revenue & valuation</p>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-500">Base ARR</span>
                          <p className="font-bold text-slate-900">{formatMoney(futureAnalysis.revenue_valuation?.base_arr)}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Implied val.</span>
                          <p className="font-bold text-slate-900">{formatMoney(futureAnalysis.revenue_valuation?.implied_valuation)}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Bull ARR</span>
                          <p className="font-bold text-emerald-800">{formatMoney(futureAnalysis.revenue_valuation?.bull_arr)}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Bear ARR</span>
                          <p className="font-bold text-rose-800">{formatMoney(futureAnalysis.revenue_valuation?.bear_arr)}</p>
                        </div>
                      </div>
                      <p className="mt-2 text-[10px] text-slate-500">{futureAnalysis.revenue_valuation?.method}</p>
                    </div>
                  </div>
                </div>
              )}

              {redTeam?.summary && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="mb-1 text-[10px] font-black uppercase tracking-wide text-amber-900">Red-team read</p>
                  <p className="text-xs leading-relaxed text-amber-950/90">{redTeam.summary}</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-600">
                    <button type="button" onClick={() => setActiveGraphTab('arr')} className={`rounded-lg px-3 py-1.5 transition ${activeGraphTab === 'arr' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'}`}>ARR Trajectory (₹)</button>
                    <button type="button" onClick={() => setActiveGraphTab('ending_cash')} className={`rounded-lg px-3 py-1.5 transition ${activeGraphTab === 'ending_cash' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'}`}>Cash & Runway (₹)</button>
                    <button type="button" onClick={() => setActiveGraphTab('ending_customers')} className={`rounded-lg px-3 py-1.5 transition ${activeGraphTab === 'ending_customers' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'}`}>Active Customers (N)</button>
                    <button type="button" onClick={() => setActiveGraphTab('operating_profit')} className={`rounded-lg px-3 py-1.5 transition ${activeGraphTab === 'operating_profit' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'}`}>Operating Profit / Burn (₹)</button>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">All scenarios diverge from identical Month 0 baseline</span>
                </div>

                {activeGraphTab === 'arr' && (
                  <MultiScenarioChart scenarios={scenarios} metric="arr" title="Annual Recurring Revenue (ARR) Trajectory" unit="₹" />
                )}
                {activeGraphTab === 'ending_cash' && (
                  <MultiScenarioChart scenarios={scenarios} metric="ending_cash" title="Cash Balance & Insolvency Runway Trajectory (with ₹0 threshold)" unit="₹" />
                )}
                {activeGraphTab === 'ending_customers' && (
                  <MultiScenarioChart scenarios={scenarios} metric="ending_customers" title="Active Paying Customers Growth Trajectory (Nₜ)" unit="count" />
                )}
                {activeGraphTab === 'operating_profit' && (
                  <MultiScenarioChart scenarios={scenarios} metric="operating_profit" title="Monthly Operating Profit / Burn & Breakeven Threshold" unit="₹" />
                )}
              </div>

              <Card title="Sensitivity Driver Ranking" subtitle="One-way ±10% perturbation ranked by ending cash impact" hover={false}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-100 font-semibold text-slate-500">
                      <tr>
                        <th className="p-2.5">Driver Assumption</th>
                        <th className="p-2.5">Adverse Case Cash</th>
                        <th className="p-2.5">Favorable Case Cash</th>
                        <th className="p-2.5">ARR Impact</th>
                        <th className="p-2.5">Cash Swing Impact</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sensitivity.map((item) => (
                        <tr key={item.variable} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="p-2.5 font-bold capitalize text-slate-900">{item.variable.replaceAll('_', ' ')}</td>
                          <td className="p-2.5 font-semibold text-rose-600">{formatMoney(item.downside_ending_cash)}</td>
                          <td className="p-2.5 font-semibold text-emerald-700">{formatMoney(item.upside_ending_cash)}</td>
                          <td className="p-2.5 text-slate-700">{formatMoney(item.impact_on_ending_arr)}</td>
                          <td className="p-2.5 font-bold text-slate-900">{formatMoney(item.impact_on_ending_cash)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card title="Monthly Forecast Schedule" subtitle="Deterministic month-by-month financial and customer schedule" hover={false}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 text-xs font-bold text-slate-600">
                    <button type="button" onClick={() => setActiveTableScenario('bull')} className={`rounded px-2.5 py-1 ${activeTableScenario === 'bull' ? 'bg-emerald-600 text-white' : ''}`}>Bull Schedule</button>
                    <button type="button" onClick={() => setActiveTableScenario('base')} className={`rounded px-2.5 py-1 ${activeTableScenario === 'base' ? 'bg-sky-600 text-white' : ''}`}>Base Schedule</button>
                    <button type="button" onClick={() => setActiveTableScenario('bear')} className={`rounded px-2.5 py-1 ${activeTableScenario === 'bear' ? 'bg-rose-600 text-white' : ''}`}>Bear Schedule</button>
                  </div>
                  <span className="text-[11px] text-slate-400">Forecast: {form.months} Months</span>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-100">
                  <table className="min-w-[1100px] w-full text-left text-[11px]">
                    <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 font-semibold text-slate-500">
                      <tr>
                        {['Mo', 'Start N', 'New', 'Churn', 'End N', 'ARPU', 'MRR', 'ARR', 'CAC', 'Mktg', 'GM', 'GP', 'Fixed', 'OPEX', 'OP', 'Start ₹', 'Fin.', 'End ₹', 'Burn Σ', 'Cash', 'BE'].map((h) => (
                          <th key={h} className="whitespace-nowrap p-2">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(scenarios[activeTableScenario]?.monthly_forecast || []).map((row) => (
                        <tr key={row.month} className="border-b border-slate-100 font-medium hover:bg-slate-50">
                          <td className="p-2 font-bold text-slate-900">M{row.month}</td>
                          <td className="p-2">{formatNumber(row.starting_customers)}</td>
                          <td className="p-2 text-emerald-600">+{formatNumber(row.new_customers)}</td>
                          <td className="p-2 text-rose-500">-{formatNumber(row.churned_customers)}</td>
                          <td className="p-2 font-bold">{formatNumber(row.ending_customers)}</td>
                          <td className="p-2">{formatMoney(row.arpu)}</td>
                          <td className="p-2 font-semibold text-slate-900">{formatMoney(row.mrr)}</td>
                          <td className="p-2 font-semibold text-slate-900">{formatMoney(row.arr)}</td>
                          <td className="p-2">{row.cac ? formatMoney(row.cac) : 'N/A'}</td>
                          <td className="p-2">{formatMoney(row.marketing_spend)}</td>
                          <td className="p-2">{formatPercent(row.gross_margin)}</td>
                          <td className="p-2">{formatMoney(row.gross_profit)}</td>
                          <td className="p-2">{formatMoney(row.fixed_costs)}</td>
                          <td className="p-2">{formatMoney(row.operating_expenses)}</td>
                          <td className={`p-2 font-bold ${row.operating_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatMoney(row.operating_profit)}</td>
                          <td className="p-2">{formatMoney(row.starting_cash)}</td>
                          <td className="p-2">{row.financing_inflow ? formatMoney(row.financing_inflow) : '—'}</td>
                          <td className={`p-2 font-bold ${row.ending_cash < 0 ? 'text-rose-600' : 'text-slate-900'}`}>{formatMoney(row.ending_cash)}</td>
                          <td className="p-2">{formatMoney(row.cumulative_burn)}</td>
                          <td className="p-2">
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${row.ending_cash <= 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{row.cash_out_status}</span>
                          </td>
                          <td className="p-2">
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${row.operating_profit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{row.break_even_status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <p className="text-center text-[10px] text-slate-400">
                {result.disclaimer} · Engine v{result.engine_version} · Simulation ID: {result.simulation_id}
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
