import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import api from '../../services/api'

export default function StartupCreateDealPage() {
  const navigate = useNavigate()
  const { user } = useAuthContext()

  const [form, setForm] = useState({
    title: '',
    pitch: '',
    funding_stage: 'Seed',
    target_raise: 750000,
    equity_pct: 7.5,
    royalty_pct: 2.5,
    royalty_payout_terms: '2.5% of quarterly gross revenues until 2.0x return cap',
    industry: user?.industry || 'CleanTech',
    thesis_doc: '',
    thesis: '',
    use_of_funds: '40% R&D & Engineering, 35% Go-To-Market & Sales, 25% Operations & Working Capital',
  })

  const [analyzing, setAnalyzing] = useState(false)
  const [aiReport, setAiReport] = useState(null)
  const [savingDraft, setSavingDraft] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [alert, setAlert] = useState(null)

  const handleThesisUpload = async (docName, thesisText) => {
    setForm((prev) => ({
      ...prev,
      thesis_doc: docName,
      thesis: thesisText,
    }))
    await triggerAnalysis(thesisText, form.pitch, form.target_raise, form.equity_pct, form.royalty_pct, form.royalty_payout_terms)
  }

  const triggerAnalysis = async (thesisText, pitch, amount, equity, royalty, payout) => {
    setAnalyzing(true)
    setAlert(null)
    try {
      const res = await api.analyzeThesis({
        pitch: pitch || form.pitch || 'Renewable energy microgrid platform',
        thesis_text: thesisText || form.thesis,
        funding_stage: form.funding_stage,
        amount: Number(amount || form.target_raise),
        equity_pct: Number(equity || form.equity_pct),
        royalty_pct: Number(royalty || form.royalty_pct),
        royalty_payout: payout || form.royalty_payout_terms,
        industry: form.industry,
      })
      setAiReport(res)
      setAlert({
        type: 'success',
        text: `AI Thesis Analysis complete! Feasibility Score: ${res.feasibility_score}/100 (${res.score_grade})`,
      })
    } catch (err) {
      setAlert({ type: 'error', text: `AI analysis error: ${err.message}` })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!form.title) {
      setAlert({ type: 'error', text: 'Please enter a deal title or one-line pitch.' })
      return
    }
    setSavingDraft(true)
    setAlert(null)
    try {
      const payload = {
        startup_id: user?.startup_id || 'startup-aerogrid',
        startup_name: user?.startup_name || 'AeroGrid Tech',
        startup_verified: Boolean(user?.is_verified),
        title: form.title,
        pitch: form.pitch || form.title,
        funding_stage: form.funding_stage,
        target_raise: Number(form.target_raise),
        equity_pct: Number(form.equity_pct),
        royalty_pct: Number(form.royalty_pct),
        royalty_payout_terms: form.royalty_payout_terms,
        thesis: form.thesis,
        thesis_doc: form.thesis_doc,
        ai_score: aiReport?.feasibility_score || 85,
        ai_report: aiReport,
        status: 'draft',
        industry: form.industry,
        use_of_funds: form.use_of_funds,
      }
      await api.createDeal(payload)
      setAlert({ type: 'success', text: 'Deal saved as draft! It is NOT listed in the marketplace yet.' })
      setTimeout(() => navigate('/startup/dashboard'), 1200)
    } catch (err) {
      setAlert({ type: 'error', text: `Failed to save draft: ${err.message}` })
    } finally {
      setSavingDraft(false)
    }
  }

  const handlePublishDeal = async () => {
    if (!form.title) {
      setAlert({ type: 'error', text: 'Please enter a deal title.' })
      return
    }
    setPublishing(true)
    setAlert(null)
    try {
      const payload = {
        startup_id: user?.startup_id || 'startup-aerogrid',
        startup_name: user?.startup_name || 'AeroGrid Tech',
        startup_verified: Boolean(user?.is_verified),
        title: form.title,
        pitch: form.pitch || form.title,
        funding_stage: form.funding_stage,
        target_raise: Number(form.target_raise),
        equity_pct: Number(form.equity_pct),
        royalty_pct: Number(form.royalty_pct),
        royalty_payout_terms: form.royalty_payout_terms,
        thesis: form.thesis,
        thesis_doc: form.thesis_doc,
        ai_score: aiReport?.feasibility_score || 88,
        ai_report: aiReport,
        status: 'published',
        industry: form.industry,
        use_of_funds: form.use_of_funds,
      }
      await api.createDeal(payload)
      setAlert({ type: 'success', text: 'Deal successfully published to the Marketplace!' })
      setTimeout(() => navigate('/startup/dashboard'), 1200)
    } catch (err) {
      setAlert({ type: 'error', text: `Failed to publish deal: ${err.message}` })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5 mb-1.5">
            Founder Deal Engine
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create Investment Deal</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure round structure (equity + royalty payout), upload investment thesis, and run AI simulations to optimize your feasibility score before publishing.
          </p>
        </div>
      </div>

      {alert && (
        <div
          className={`rounded-xl p-4 text-xs font-semibold flex items-center justify-between shadow-xs ${
            alert.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
              : 'bg-red-50 border border-red-300 text-red-900'
          }`}
        >
          <span>{alert.text}</span>
          <button onClick={() => setAlert(null)} className="font-bold ml-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* Main Grid: Form Left, AI Feasibility & Simulation Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Deal Configuration Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 text-xs">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Round Parameters & Offering Terms
            </h2>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Deal Title / Opportunity Headline</label>
              <input
                type="text"
                required
                placeholder="e.g. AeroGrid — Autonomous Grid-Edge Storage Orchestration"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">One-Line Pitch</label>
              <textarea
                rows={2}
                placeholder="Crisp elevator pitch explaining customer problem and unique value proposition..."
                value={form.pitch}
                onChange={(e) => setForm({ ...form, pitch: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Funding Stage</label>
                <select
                  value={form.funding_stage}
                  onChange={(e) => setForm({ ...form, funding_stage: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Pre-Seed">Pre-Seed</option>
                  <option value="Seed">Seed</option>
                  <option value="Series A">Series A</option>
                  <option value="Series B">Series B</option>
                  <option value="Growth">Growth</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Raise Amount ($)</label>
                <input
                  type="number"
                  required
                  value={form.target_raise}
                  onChange={(e) => setForm({ ...form, target_raise: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Hybrid Equity & Royalty Block */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
              <h3 className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                <span>⚖️ Hybrid Equity & Royalty Payout Structure</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Equity Percentage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.equity_pct}
                    onChange={(e) => setForm({ ...form, equity_pct: e.target.value })}
                    className="w-full rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Equity ownership share for round</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">Royalty Percentage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.royalty_pct}
                    onChange={(e) => setForm({ ...form, royalty_pct: e.target.value })}
                    className="w-full rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Revenue share percentage</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">Payout Terms (with Royalty)</label>
                <input
                  type="text"
                  value={form.royalty_payout_terms}
                  onChange={(e) => setForm({ ...form, royalty_payout_terms: e.target.value })}
                  placeholder="e.g. 2.5% quarterly gross revenues until 2.0x return cap"
                  className="w-full rounded-lg border border-amber-300 px-3 py-2 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Defines payout frequency, payback multiple cap, and revenue conditions
                </span>
              </div>
            </div>

            {/* Thesis Upload / Document Section */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-xs">Investment Thesis Document</h3>
                <span className="text-[10px] text-emerald-700 font-semibold">AI Analysis Trigger</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="e.g. AeroGrid_Seed_Thesis_2026.pdf"
                  value={form.thesis_doc}
                  onChange={(e) => setForm({ ...form, thesis_doc: e.target.value })}
                  className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleThesisUpload(
                      'AeroGrid_Commercial_Thesis_v2.pdf',
                      'Renewable micro-grids will handle 32% of commercial electricity distribution by 2030. Our frequency synchronization algorithm slashes battery cell degradation by 40% with proven gross margins above 72% across 3 signed customer pilot facilities.'
                    )
                  }
                  className="rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold px-3 py-2 text-xs transition cursor-pointer whitespace-nowrap"
                >
                  Load Sample Thesis
                </button>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Thesis Text / Executive Argument</label>
                <textarea
                  rows={4}
                  placeholder="Detail your unit economics, macro market tailwinds, and why this business model will achieve outsized returns..."
                  value={form.thesis}
                  onChange={(e) => setForm({ ...form, thesis: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => triggerAnalysis(form.thesis, form.pitch, form.target_raise, form.equity_pct, form.royalty_pct, form.royalty_payout_terms)}
                  disabled={analyzing || !form.thesis}
                  className="rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {analyzing ? 'Analyzing with AI...' : '⚡ Analyze Thesis with AI'}
                </button>
              </div>
            </div>

            {/* Bottom Actions: Save Draft & Publish Deal */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={savingDraft || publishing}
                className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 px-5 py-2.5 text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                {savingDraft ? 'Saving Draft...' : '💾 Save as Draft'}
              </button>

              <button
                type="button"
                onClick={handlePublishDeal}
                disabled={publishing || savingDraft}
                className="w-full sm:w-auto rounded-xl bg-[#0f3d2e] hover:bg-[#165540] text-white px-6 py-2.5 text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {publishing ? 'Publishing...' : '🚀 Publish Deal to Marketplace'}
              </button>
            </div>
          </div>
        </div>

        {/* AI Thesis Analysis & Market Simulation Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">AI Thesis Feasibility Engine</h3>
                <p className="text-[11px] text-slate-400">Market simulations & pain point detection</p>
              </div>
              {aiReport && (
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Score</span>
                  <span className="text-2xl font-black text-emerald-700">
                    {aiReport.feasibility_score}/100
                  </span>
                </div>
              )}
            </div>

            {aiReport ? (
              <div className="space-y-4 text-xs">
                {/* Summary */}
                <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-slate-700 leading-relaxed">
                  <span className="font-bold text-slate-900 block mb-1">AI Executive Verdict</span>
                  {aiReport.summary}
                </div>

                {/* 12-Month Market Simulation Scenarios (Bull, Base, Bear) */}
                {aiReport.simulation && (
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
                      12-Month Mathematical Projections
                    </h4>
                    <div className="space-y-2">
                      <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/40">
                        <div className="flex items-center justify-between font-bold text-emerald-950">
                          <span>🟢 Bull Case (Optimistic)</span>
                          <span>${(aiReport.simulation.bull.annual_revenue || 0).toLocaleString()} ARR</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-800">
                          <span>Runway: {aiReport.simulation.bull.runway_months} mo</span>
                          <span>Payback: {aiReport.simulation.bull.royalty_payback_months} mo</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg border border-slate-200 bg-slate-50">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>🔵 Base Case (Target Plan)</span>
                          <span>${(aiReport.simulation.base.annual_revenue || 0).toLocaleString()} ARR</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600">
                          <span>Runway: {aiReport.simulation.base.runway_months} mo</span>
                          <span>Payback: {aiReport.simulation.base.royalty_payback_months} mo</span>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/40">
                        <div className="flex items-center justify-between font-bold text-amber-950">
                          <span>🟠 Bear Case (Headwinds)</span>
                          <span>${(aiReport.simulation.bear.annual_revenue || 0).toLocaleString()} ARR</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-amber-800">
                          <span>Runway: {aiReport.simulation.bear.runway_months} mo</span>
                          <span>Payback: {aiReport.simulation.bear.royalty_payback_months} mo</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Pain Points Identified */}
                {aiReport.pain_points && aiReport.pain_points.length > 0 && (
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
                      Identified Vulnerabilities & Pain Points
                    </h4>
                    <div className="space-y-2">
                      {aiReport.pain_points.map((p, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg border border-red-100 bg-red-50/30 text-[11px]">
                          <div className="font-bold text-red-900 flex items-center gap-1.5">
                            <span>⚠️ {p.category}</span>
                            <span className="text-[9px] uppercase px-1.5 rounded bg-red-200/60 font-bold">
                              {p.severity}
                            </span>
                          </div>
                          <p className="text-slate-700 mt-1">{p.issue}</p>
                          <p className="text-emerald-700 mt-1 font-semibold">Tip: {p.mitigation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {aiReport.recommendations && (
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <span className="font-bold text-slate-900 block mb-1">Recommendations to Boost Score:</span>
                    <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px]">
                      {aiReport.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    navigate('/simulation', {
                      state: {
                        fromThesis: 1,
                        thesis: form.thesis,
                        aiReport,
                        assumptions: aiReport.extracted_assumptions,
                        simulatorForm: aiReport.simulator_form,
                        futureAnalysis: aiReport.future_analysis,
                        scenarios: aiReport.scenarios,
                        sensitivity: aiReport.sensitivity,
                        simulationDetail: aiReport.simulation_detail,
                        insights: aiReport.insights,
                      },
                    })
                  }
                  className="w-full rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100"
                >
                  Open in Financial Simulator
                </button>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <div className="text-3xl">📊</div>
                <p className="font-semibold text-slate-600">No Thesis Analyzed Yet</p>
                <p>
                  Upload your thesis document or load a sample thesis to generate a live market simulation, detect pain points, and predict your feasibility score.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
