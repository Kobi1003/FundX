import { useCallback, useEffect, useMemo, useState } from 'react'
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
  Wrench,
  Zap
} from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'
import { api } from '../services/api'

// Canonical consistent starting dataset (Section 36)
const initialForm = {
  company_name: 'FinFlow Tech',
  industry: 'B2B FinTech SaaS',
  stage: 'Seed / Series A',
  current_mrr: 5000000,       // ₹50L
  funding: 30000000,           // ₹3Cr starting cash
  current_customers: 1000,     // 1,000 customers
  pricing: 5000,               // ₹5,000 ARPU / month -> 1,000 * ₹5,000 = ₹50,00,000 MRR!
  cac: 30000,                  // ₹30,000 CAC
  marketing_spend: 1000000,    // ₹10,00,000 / month marketing
  growth_rate: 0.40,           // 40% annual growth
  churn: 0.03,                 // 3% monthly churn
  starting_gross_margin: 0.75, // 75% gross margin
  operating_expenses: 2000000, // ₹20,00,000 fixed costs
  growth_decay_rate: 0.0,
  months: 24,
  investment_amount: 0,
  equity_percentage: 0.10,
  investment_month: 1,
  use_historical_data: false,
  historical_growth_rates_str: '0.08, 0.12, 0.10, 0.15, 0.07, 0.13, 0.11, 0.09',
  historical_cac_str: '28000, 30000, 31000, 29000, 34000, 32000',
  historical_churn_str: '0.025, 0.030, 0.028, 0.032, 0.035',
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
      startVal = (forecast[0]?.gross_profit || 0) - (forecast[0]?.operating_expenses || 0)
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
  const height = 280
  const padding = { top: 20, right: 30, bottom: 35, left: 60 }
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
    <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      {/* Header & Legends */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">Pure deterministic multi-scenario trajectory</p>
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
          className="h-64 w-full select-none overflow-visible"
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
        <span className="text-[11px] font-semibold text-slate-600">{label}</span>
        {tooltip && (
          <span title={tooltip} className="cursor-help text-slate-400 hover:text-slate-600">
            <HelpCircle className="h-3 w-3" />
          </span>
        )}
      </div>
      <div className="relative">
        <input
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          type="number"
          name={name}
          value={value}
          step={step}
          onChange={onChange}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-2 text-xs font-semibold text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </label>
  )
}

export default function SimulationPage() {
  const [form, setForm] = useState(initialForm)
  const [result, setResult] = useState(null)
  const [sensitivity, setSensitivity] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeGraphTab, setActiveGraphTab] = useState('arr')
  const [activeTableScenario, setActiveTableScenario] = useState('base')
  const [advanced, setAdvanced] = useState(false)
  const [caseType, setCaseType] = useState('claimed')

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
      operating_expenses: Number(form.operating_expenses),
      marketing_spend: Number(form.marketing_spend),
      growth_rate: Number(form.growth_rate),
      growth_decay_rate: Number(form.growth_decay_rate),
      months: Number(form.months),
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

  const update = (event) =>
    setForm((previous) => ({
      ...previous,
      [event.target.name]:
        event.target.type === 'checkbox' ? event.target.checked : event.target.value,
    }))

  const runSimulation = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [scenarioResponse, sensitivityResponse] = await Promise.all([
        api.runSimulationScenarios(payload),
        api.runSimulationSensitivity(payload),
      ])
      setResult(scenarioResponse)
      setSensitivity(sensitivityResponse.sensitivity || [])
    } catch (err) {
      setError(err.message || 'Unable to run the simulation.')
    } finally {
      setLoading(false)
    }
  }, [payload])

  // Debounced auto-recalculation when inputs change
  useEffect(() => {
    if (!result) return undefined
    const timer = window.setTimeout(() => {
      runSimulation()
    }, 600)
    return () => window.clearTimeout(timer)
  }, [payload]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    runSimulation()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const scenarios = result?.scenarios || {}
  const bull = scenarios.bull
  const base = scenarios.base
  const bear = scenarios.bear
  const redTeam = result?.summary?.red_team_analysis

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0c2a21] via-[#104334] to-[#175c46] p-6 text-white shadow-xl">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-emerald-300">
              <FlaskConical className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Audited Deterministic Financial Engine · v2.0.0
              </span>
            </div>
            <h1 className="text-2xl font-black md:text-3xl">Startup Financial Scenario Engine</h1>
            <p className="mt-2 max-w-2xl text-sm text-emerald-100/90">
              Mathematically unified revenue model (MRR = Customers × ARPU) driving P&L, monthly cashflows, Bull/Base/Bear scenarios, and sensitivity rankings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={runSimulation}
              disabled={loading}
              className="bg-amber-400 font-bold text-slate-950 shadow-md hover:bg-amber-300"
            >
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {loading ? 'Evaluating Model…' : 'Recalculate Model'}
            </Button>
          </div>
        </div>
      </div>

      {/* Critical Input Inconsistency Banner (Section 2 & 24) */}
      {hasInconsistency && (
        <div className="rounded-2xl border-2 border-rose-500 bg-rose-50 p-5 text-rose-950 shadow-md">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-extrabold text-rose-900 uppercase tracking-wide">
                  Critical Input Inconsistency Detected
                </h3>
                <p className="mt-1 text-xs text-rose-800 leading-relaxed font-medium">
                  Starting MRR (<strong>{formatMoney(reportedMRR)}</strong>) does not reconcile with Customers ({formatNumber(customersCount)}) × ARPU ({formatMoney(arpuValue)}) = <strong>{formatMoney(impliedMRR)}</strong> (Discrepancy: <strong>{discrepancyPct.toFixed(1)}%</strong>). The simulation engine requires coherent baseline numbers.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => setForm((prev) => ({ ...prev, current_mrr: impliedMRR }))}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition"
              >
                <Wrench className="h-3.5 w-3.5" />
                <span>Use Customers × ARPU ({formatMoney(impliedMRR)})</span>
              </button>
              <button
                onClick={() => setForm((prev) => ({ ...prev, pricing: customersCount > 0 ? reportedMRR / customersCount : prev.pricing }))}
                className="flex items-center gap-1.5 rounded-lg bg-white border border-rose-300 px-3 py-1.5 text-xs font-bold text-rose-800 shadow-xs hover:bg-rose-100 transition"
              >
                <span>Adjust ARPU ({formatMoney(customersCount > 0 ? reportedMRR / customersCount : 0)})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Inputs Form Left vs Graphs & Outputs Right */}
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        {/* Left Column: Model Parameters Form */}
        <div className="space-y-4">
          <Card
            title="Core Operating Drivers"
            subtitle="Verified startup inputs (All internal math in raw INR)"
            hover={false}
          >
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold text-slate-600">
                  Company Name
                </span>
                <input
                  name="company_name"
                  value={form.company_name}
                  onChange={update}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-emerald-500"
                />
              </label>

              {/* 10 Canonical Parameters */}
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="Starting MRR (M₀)"
                  name="current_mrr"
                  value={form.current_mrr}
                  onChange={update}
                  suffix="₹"
                  tooltip="User-supplied starting monthly recurring revenue"
                />
                <Field
                  label="Starting Cash (C₀)"
                  name="funding"
                  value={form.funding}
                  onChange={update}
                  suffix="₹"
                  tooltip="Starting liquid cash reserves at Month 0"
                />
                <Field
                  label="Customers (N₀)"
                  name="current_customers"
                  value={form.current_customers}
                  onChange={update}
                  tooltip="Total active paying customer count at Month 0"
                />
                <Field
                  label="ARPU / month (A₀)"
                  name="pricing"
                  value={form.pricing}
                  onChange={update}
                  suffix="₹"
                  tooltip="Average Revenue Per User per month"
                />
                <Field
                  label="CAC (K₀)"
                  name="cac"
                  value={form.cac}
                  onChange={update}
                  suffix="₹"
                  tooltip="Customer Acquisition Cost"
                />
                <Field
                  label="Marketing / mo (P₀)"
                  name="marketing_spend"
                  value={form.marketing_spend}
                  onChange={update}
                  suffix="₹"
                  tooltip="Monthly marketing acquisition budget"
                />
              </div>

              {/* Growth, Churn, Margin, Fixed Costs */}
              <div className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <div>
                  <Field
                    label="Annual Growth (gₐ)"
                    name="growth_rate"
                    value={form.growth_rate}
                    onChange={update}
                    step="0.01"
                    suffix="dec"
                    tooltip="Target annual organic growth reference"
                  />
                  <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                    <Zap className="h-3 w-3" />
                    <span>gₘ ≈ {(monthlyGrowthEquivalent * 100).toFixed(2)}%/mo</span>
                  </div>
                </div>

                <Field
                  label="Monthly Churn (c)"
                  name="churn"
                  value={form.churn}
                  onChange={update}
                  suffix="dec"
                  step="0.005"
                  tooltip="Monthly customer attrition rate"
                />
                <Field
                  label="Gross Margin (G)"
                  name="starting_gross_margin"
                  value={form.starting_gross_margin}
                  onChange={update}
                  suffix="dec"
                  step="0.01"
                  tooltip="Gross profit margin on revenue"
                />
                <Field
                  label="Fixed Costs (F)"
                  name="operating_expenses"
                  value={form.operating_expenses}
                  onChange={update}
                  suffix="₹"
                  tooltip="Monthly fixed operating overhead"
                />
              </div>

              {/* Historical Volatility Override */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                <label className="flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span>Historical Data Volatility (Mean ± σ)</span>
                  <input
                    type="checkbox"
                    name="use_historical_data"
                    checked={form.use_historical_data}
                    onChange={update}
                    className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </label>
                <p className="mt-1 text-[10px] text-emerald-700">
                  Derive Bull/Base/Bear dynamically from historical standard deviation instead of benchmark multipliers.
                </p>

                {form.use_historical_data && (
                  <div className="mt-3 space-y-2 border-t border-emerald-200/60 pt-2">
                    <label className="block text-[10px] font-semibold text-slate-700">
                      Historical Growth Rates (CSV):
                      <input
                        name="historical_growth_rates_str"
                        value={form.historical_growth_rates_str}
                        onChange={update}
                        className="mt-0.5 w-full rounded border border-slate-300 bg-white p-1.5 text-xs"
                      />
                    </label>
                    <label className="block text-[10px] font-semibold text-slate-700">
                      Historical CAC Series (₹ CSV):
                      <input
                        name="historical_cac_str"
                        value={form.historical_cac_str}
                        onChange={update}
                        className="mt-0.5 w-full rounded border border-slate-300 bg-white p-1.5 text-xs"
                      />
                    </label>
                    <label className="block text-[10px] font-semibold text-slate-700">
                      Historical Churn Series (CSV):
                      <input
                        name="historical_churn_str"
                        value={form.historical_churn_str}
                        onChange={update}
                        className="mt-0.5 w-full rounded border border-slate-300 bg-white p-1.5 text-xs"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Horizon & Financing Controls */}
              <button
                type="button"
                onClick={() => setAdvanced(!advanced)}
                className="flex w-full items-center justify-between border-t border-slate-100 pt-3 text-xs font-bold text-emerald-700"
              >
                <span>Forecast Horizon & Financing Round</span>
                <ChevronDown className={`h-4 w-4 transition ${advanced ? 'rotate-180' : ''}`} />
              </button>

              {advanced && (
                <div className="space-y-3 rounded-xl bg-slate-50 p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Forecast Horizon"
                      name="months"
                      value={form.months}
                      onChange={update}
                      suffix="mo"
                      step="12"
                    />
                    <Field
                      label="Growth Decay"
                      name="growth_decay_rate"
                      value={form.growth_decay_rate}
                      onChange={update}
                      step="0.01"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Round Investment"
                      name="investment_amount"
                      value={form.investment_amount}
                      onChange={update}
                      suffix="₹"
                    />
                    <Field
                      label="Equity Share"
                      name="equity_percentage"
                      value={form.equity_percentage}
                      onChange={update}
                      step="0.01"
                    />
                  </div>
                  <label className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    Input Mode
                    <select
                      value={caseType}
                      onChange={(e) => setCaseType(e.target.value)}
                      className="rounded border border-slate-200 bg-white px-2 py-1 text-slate-700"
                    >
                      <option value="claimed">Claimed Data Scenario</option>
                      <option value="verified">Verified Data Scenario</option>
                    </select>
                  </label>
                </div>
              )}
            </div>
          </Card>

          {/* Mathematical Invariant Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Scale className="h-4 w-4 text-emerald-600" />
              <span>Unified Mathematical Invariants</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed">
              <li><strong>MRRₜ:</strong> Ending Customersₜ × ARPUₜ</li>
              <li><strong>ARRₜ:</strong> MRRₜ × 12</li>
              <li><strong>New Customersₜ:</strong> Marketingₜ / CACₜ</li>
              <li><strong>Churned Customersₜ:</strong> Starting Customersₜ × Churnₜ</li>
              <li><strong>Gross Profitₜ:</strong> MRRₜ × Gross Marginₜ</li>
              <li><strong>Operating Profitₜ:</strong> Gross Profitₜ - OPEXₜ</li>
              <li><strong>Ending Cashₜ:</strong> Starting Cashₜ + Operating Profitₜ + Financingₜ</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Scenario Evaluations, Graphs & Tables */}
        <div className="space-y-6">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl bg-white p-8 text-center shadow-xs">
              <LoaderCircle className="h-8 w-8 animate-spin text-emerald-600" />
              <p className="mt-3 text-sm font-bold text-slate-800">Evaluating Deterministic Simulation…</p>
              <p className="text-xs text-slate-500">Calculating monthly cohorts, unit economics & runway dynamics.</p>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Scenario Summary Cards (Section 30 & 31) */}
              <div className="grid gap-4 md:grid-cols-3">
                {/* BULL CARD */}
                {bull && (
                  <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 to-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-emerald-800">
                        <Rocket className="h-3.5 w-3.5" /> Bull Case
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700">Upside Scenario</span>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-[11px] font-medium text-slate-500">{form.months}M Ending ARR</p>
                        <p className="text-2xl font-black text-slate-900">{formatMoney(bull.ending_arr)}</p>
                        <p className="text-[10px] text-slate-500">Ending MRR: {formatMoney(bull.ending_mrr)}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t border-emerald-100 pt-2 text-xs">
                        <div>
                          <span className="text-slate-500">Break-even</span>
                          <p className="font-bold text-slate-800">
                            {bull.break_even_month !== null ? (bull.break_even_month === 0 ? 'Month 0' : `Month ${bull.break_even_month}`) : 'Not reached'}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500">Runway</span>
                          <p className="font-bold text-emerald-700">{bull.runway_display}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Ending Cash</span>
                          <p className="font-bold text-slate-800">{formatMoney(bull.ending_cash)}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Ending Users</span>
                          <p className="font-bold text-slate-800">{formatNumber(bull.ending_customers)}</p>
                        </div>
                      </div>

                      {/* Bull Scenario Assumptions Breakdown */}
                      <div className="rounded-lg bg-emerald-50/80 p-2.5 text-[10px] text-slate-700 space-y-1">
                        <div className="font-bold text-emerald-900 uppercase">Bull Assumptions:</div>
                        <div className="grid grid-cols-2 gap-1 text-[10px]">
                          <span>CAC: {formatMoney(bull.unit_economics?.cac)}</span>
                          <span>Churn: {formatPercent(bull.unit_economics?.churn)}</span>
                          <span>ARPU: {formatMoney(bull.unit_economics?.arpu)}</span>
                          <span>Margin: {formatPercent(bull.unit_economics?.gross_margin)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* BASE CARD */}
                {base && (
                  <div className="relative overflow-hidden rounded-2xl border-2 border-sky-500/30 bg-gradient-to-b from-sky-500/10 to-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-sky-800">
                        <Scale className="h-3.5 w-3.5" /> Base Case
                      </span>
                      <span className="text-[10px] font-bold text-sky-700">Expected Plan</span>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-[11px] font-medium text-slate-500">{form.months}M Ending ARR</p>
                        <p className="text-2xl font-black text-slate-900">{formatMoney(base.ending_arr)}</p>
                        <p className="text-[10px] text-slate-500">Ending MRR: {formatMoney(base.ending_mrr)}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t border-sky-100 pt-2 text-xs">
                        <div>
                          <span className="text-slate-500">Break-even</span>
                          <p className="font-bold text-slate-800">
                            {base.break_even_month !== null ? (base.break_even_month === 0 ? 'Month 0' : `Month ${base.break_even_month}`) : 'Not reached'}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500">Runway</span>
                          <p className="font-bold text-sky-700">{base.runway_display}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Ending Cash</span>
                          <p className={`font-bold ${base.ending_cash < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                            {formatMoney(base.ending_cash)}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500">Capital Need</span>
                          <p className="font-bold text-slate-800">
                            {base.additional_capital_required > 0 ? formatMoney(base.additional_capital_required) : '₹0'}
                          </p>
                        </div>
                      </div>

                      {/* Base Scenario Assumptions Breakdown */}
                      <div className="rounded-lg bg-sky-50/80 p-2.5 text-[10px] text-slate-700 space-y-1">
                        <div className="font-bold text-sky-900 uppercase">Base Assumptions:</div>
                        <div className="grid grid-cols-2 gap-1 text-[10px]">
                          <span>CAC: {formatMoney(base.unit_economics?.cac)}</span>
                          <span>Churn: {formatPercent(base.unit_economics?.churn)}</span>
                          <span>ARPU: {formatMoney(base.unit_economics?.arpu)}</span>
                          <span>Margin: {formatPercent(base.unit_economics?.gross_margin)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* BEAR CARD */}
                {bear && (
                  <div className="relative overflow-hidden rounded-2xl border-2 border-rose-500/30 bg-gradient-to-b from-rose-500/10 to-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-rose-800">
                        <Flame className="h-3.5 w-3.5" /> Bear Case
                      </span>
                      <span className="text-[10px] font-bold text-rose-700">Downside Stress</span>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <p className="text-[11px] font-medium text-slate-500">{form.months}M Ending ARR</p>
                        <p className="text-2xl font-black text-slate-900">{formatMoney(bear.ending_arr)}</p>
                        <p className="text-[10px] text-slate-500">Ending MRR: {formatMoney(bear.ending_mrr)}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t border-rose-100 pt-2 text-xs">
                        <div>
                          <span className="text-slate-500">Break-even</span>
                          <p className="font-bold text-slate-800">
                            {bear.break_even_month !== null ? (bear.break_even_month === 0 ? 'Month 0' : `Month ${bear.break_even_month}`) : 'Not reached'}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500">Runway</span>
                          <p className="font-bold text-rose-700">{bear.runway_display}</p>
                        </div>
                        <div>
                          <span className="text-slate-500">Ending Cash</span>
                          <p className={`font-bold ${bear.ending_cash < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                            {formatMoney(bear.ending_cash)}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-500">Capital Need</span>
                          <p className="font-bold text-rose-700">
                            {bear.additional_capital_required > 0 ? formatMoney(bear.additional_capital_required) : '₹0'}
                          </p>
                        </div>
                      </div>

                      {/* Bear Scenario Assumptions Breakdown */}
                      <div className="rounded-lg bg-rose-50/80 p-2.5 text-[10px] text-slate-700 space-y-1">
                        <div className="font-bold text-rose-900 uppercase">Bear Assumptions:</div>
                        <div className="grid grid-cols-2 gap-1 text-[10px]">
                          <span>CAC: {formatMoney(bear.unit_economics?.cac)}</span>
                          <span>Churn: {formatPercent(bear.unit_economics?.churn)}</span>
                          <span>ARPU: {formatMoney(bear.unit_economics?.arpu)}</span>
                          <span>Margin: {formatPercent(bear.unit_economics?.gross_margin)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Red Team & Stress-Test Panel (Section 32) */}
              <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/80 via-orange-50/50 to-amber-50/80 p-5 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-black shadow-xs">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-amber-950">
                        AI Red Team & Solvency Vulnerability Analysis
                      </h4>
                      <span className="rounded-md bg-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-900">
                        Stress Evaluation
                      </span>
                    </div>
                    <p className="text-xs text-amber-900/90 leading-relaxed font-medium">
                      {redTeam?.summary ||
                        `The startup's outcome is highly sensitive to CAC and churn. Under Bear headwinds, runway drops to ${bear?.runway_display} with ₹${bear?.additional_capital_required?.toLocaleString()} in required capital.`}
                    </p>
                  </div>
                </div>
              </div>

              {/* 4 Primary Graphical Charts (Section 28 & 29) */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-bold text-slate-600">
                    <button
                      onClick={() => setActiveGraphTab('arr')}
                      className={`rounded-lg px-3 py-1.5 transition ${activeGraphTab === 'arr' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'}`}
                    >
                      ARR Trajectory (₹)
                    </button>
                    <button
                      onClick={() => setActiveGraphTab('ending_cash')}
                      className={`rounded-lg px-3 py-1.5 transition ${activeGraphTab === 'ending_cash' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'}`}
                    >
                      Cash & Runway (₹)
                    </button>
                    <button
                      onClick={() => setActiveGraphTab('ending_customers')}
                      className={`rounded-lg px-3 py-1.5 transition ${activeGraphTab === 'ending_customers' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'}`}
                    >
                      Active Customers (N)
                    </button>
                    <button
                      onClick={() => setActiveGraphTab('operating_profit')}
                      className={`rounded-lg px-3 py-1.5 transition ${activeGraphTab === 'operating_profit' ? 'bg-white text-emerald-800 shadow-xs' : 'hover:text-slate-900'}`}
                    >
                      Operating Profit / Burn (₹)
                    </button>
                  </div>

                  <span className="text-[11px] font-semibold text-slate-400">
                    All scenarios diverge from identical Month 0 baseline
                  </span>
                </div>

                {activeGraphTab === 'arr' && (
                  <MultiScenarioChart
                    scenarios={scenarios}
                    metric="arr"
                    title="Annual Recurring Revenue (ARR) Trajectory (Month 0 → 24)"
                    unit="₹"
                  />
                )}
                {activeGraphTab === 'ending_cash' && (
                  <MultiScenarioChart
                    scenarios={scenarios}
                    metric="ending_cash"
                    title="Cash Balance & Insolvency Runway Trajectory (with ₹0 threshold)"
                    unit="₹"
                  />
                )}
                {activeGraphTab === 'ending_customers' && (
                  <MultiScenarioChart
                    scenarios={scenarios}
                    metric="ending_customers"
                    title="Active Paying Customers Growth Trajectory (Nₜ)"
                    unit="count"
                  />
                )}
                {activeGraphTab === 'operating_profit' && (
                  <MultiScenarioChart
                    scenarios={scenarios}
                    metric="operating_profit"
                    title="Monthly Operating Profit / Burn & Breakeven Threshold"
                    unit="₹"
                  />
                )}
              </div>

              {/* Sensitivity Ranking Table (Section 27) */}
              <Card
                title="Sensitivity Driver Ranking"
                subtitle="One-way ±10% perturbation ranked by ending cash impact"
                hover={false}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-100 text-slate-500 font-semibold">
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
                          <td className="p-2.5 font-bold capitalize text-slate-900">
                            {item.variable.replaceAll('_', ' ')}
                          </td>
                          <td className="p-2.5 text-rose-600 font-semibold">
                            {formatMoney(item.downside_ending_cash)}
                          </td>
                          <td className="p-2.5 text-emerald-700 font-semibold">
                            {formatMoney(item.upside_ending_cash)}
                          </td>
                          <td className="p-2.5 text-slate-700">
                            {formatMoney(item.impact_on_ending_arr)}
                          </td>
                          <td className="p-2.5 font-bold text-slate-900">
                            {formatMoney(item.impact_on_ending_cash)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Complete 21-Column Monthly Forecast Table (Section 23) */}
              <Card
                title="Monthly Forecast Schedule"
                subtitle="Deterministic month-by-month financial and customer schedule"
                hover={false}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 text-xs font-bold text-slate-600">
                    <button
                      onClick={() => setActiveTableScenario('bull')}
                      className={`rounded px-2.5 py-1 ${activeTableScenario === 'bull' ? 'bg-emerald-600 text-white' : ''}`}
                    >
                      Bull Schedule
                    </button>
                    <button
                      onClick={() => setActiveTableScenario('base')}
                      className={`rounded px-2.5 py-1 ${activeTableScenario === 'base' ? 'bg-sky-600 text-white' : ''}`}
                    >
                      Base Schedule
                    </button>
                    <button
                      onClick={() => setActiveTableScenario('bear')}
                      className={`rounded px-2.5 py-1 ${activeTableScenario === 'bear' ? 'bg-rose-600 text-white' : ''}`}
                    >
                      Bear Schedule
                    </button>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Forecast: {form.months} Months
                  </span>
                </div>

                <div className="max-h-96 overflow-x-auto overflow-y-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2">Mo</th>
                        <th className="p-2">Start Users</th>
                        <th className="p-2">New Users</th>
                        <th className="p-2">Churned</th>
                        <th className="p-2">End Users</th>
                        <th className="p-2">ARPU</th>
                        <th className="p-2">MRR</th>
                        <th className="p-2">ARR</th>
                        <th className="p-2">CAC</th>
                        <th className="p-2">Marketing</th>
                        <th className="p-2">Margin</th>
                        <th className="p-2">Gross Profit</th>
                        <th className="p-2">Fixed Costs</th>
                        <th className="p-2">OPEX</th>
                        <th className="p-2">Operating Profit</th>
                        <th className="p-2">Start Cash</th>
                        <th className="p-2">Financing</th>
                        <th className="p-2">End Cash</th>
                        <th className="p-2">Cumulative Burn</th>
                        <th className="p-2">Cash-Out</th>
                        <th className="p-2">Break-Even</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(scenarios[activeTableScenario]?.monthly_forecast || []).map((row) => (
                        <tr key={row.month} className="border-b border-slate-100 hover:bg-slate-50 font-medium">
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
                          <td className={`p-2 font-bold ${row.operating_profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatMoney(row.operating_profit)}
                          </td>
                          <td className="p-2">{formatMoney(row.starting_cash)}</td>
                          <td className="p-2">{row.financing_inflow ? formatMoney(row.financing_inflow) : '—'}</td>
                          <td className={`p-2 font-bold ${row.ending_cash < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                            {formatMoney(row.ending_cash)}
                          </td>
                          <td className="p-2">{formatMoney(row.cumulative_burn)}</td>
                          <td className="p-2">
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${row.ending_cash <= 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {row.cash_out_status}
                            </span>
                          </td>
                          <td className="p-2">
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${row.operating_profit >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {row.break_even_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Engine Version & Disclaimer Footer */}
              <p className="text-center text-xs text-slate-400">
                {result.disclaimer} · Engine v{result.engine_version} · Simulation ID: {result.simulation_id}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
