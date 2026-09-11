import React, { useState } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  Building,
  FileCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  Download,
  AlertCircle,
  FileText,
  Layers,
} from 'lucide-react'

export default function InvestorDueDiligenceReportView({ report }) {
  const [showTrace, setShowTrace] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('ALL')

  if (!report) return null

  // Support both direct report object or nested report
  const ddReport = report.due_diligence_report || report.report || report

  const {
    investor_name,
    claimed_organization,
    organization,
    claimed_designation,
    designation,
    investor_type = 'ANGEL_INVESTOR',
    investigation_timestamp,
    timestamp,
    total_claims = 0,
    verified_count = 0,
    partially_verified_count = 0,
    unverified_count = 0,
    contradicted_count = 0,
    requires_review_count = 0,
    overall_status = 'UNVERIFIED',
    overall_evidence_strength = 'INSUFFICIENT',
    overall_assessment = {},
    identity_resolution = {},
    regulatory_checks = [],
    investment_evaluations = [],
    verifications = [],
    contradictions = [],
    activity_trace = [],
    disclaimer,
  } = ddReport

  const orgName = claimed_organization || organization || ''
  const desigName = claimed_designation || designation || ''

  const {
    verdict = 'ASSESSMENT UNAVAILABLE — RE-RUN VERIFICATION',
    evidence_coverage_pct = 0,
    strongly_corroborated = [],
    requires_verification = [],
    risk_flags = [],
  } = overall_assessment

  const {
    identity_confidence = 'UNKNOWN',
    homonym_collision_risk = 'UNKNOWN',
    distinct_public_hosts = [],
  } = identity_resolution

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(ddReport, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `Investor_DueDiligence_${investor_name.replace(/\s+/g, '_')}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'STRONG EVIDENCE':
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#0f766e] text-white">
            <CheckCircle2 className="w-3.5 h-3.5" />
            STRONG EVIDENCE
          </span>
        )
      case 'PARTIALLY VERIFIED':
      case 'PARTIALLY_VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#d97706] text-white">
            <AlertTriangle className="w-3.5 h-3.5" />
            PARTIALLY VERIFIED
          </span>
        )
      case 'REQUIRES VERIFICATION':
      case 'REQUIRES_HUMAN_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#7c3aed] text-white">
            <ShieldAlert className="w-3.5 h-3.5" />
            REQUIRES VERIFICATION
          </span>
        )
      case 'CONTRADICTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#b91c1c] text-white">
            <XCircle className="w-3.5 h-3.5" />
            CONTRADICTED
          </span>
        )
      case 'NOT APPLICABLE':
      case 'NOT_APPLICABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#94a3b8] text-white">
            <HelpCircle className="w-3.5 h-3.5" />
            NOT APPLICABLE
          </span>
        )
      case 'INSUFFICIENT EVIDENCE':
      case 'UNVERIFIED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#64748b] text-white">
            <HelpCircle className="w-3.5 h-3.5" />
            INSUFFICIENT EVIDENCE
          </span>
        )
    }
  }

  const getSourceTierBadge = (tier) => {
    switch (tier) {
      case 'TIER_1':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#1d4ed8] text-white">TIER 1 (GOV/EDU)</span>
      case 'TIER_2':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#059669] text-white">TIER 2 (PRESS)</span>
      case 'TIER_3':
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#475569] text-white">TIER 3 (DIRECTORY)</span>
      case 'TIER_4':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-500 text-white">TIER 4 (WEB)</span>
    }
  }

  const categories = ['ALL', 'EMPLOYMENT', 'ANGEL_SYNDICATE_INVESTMENT', 'EDUCATION', 'REGULATORY_REGISTRATION', 'TRACK_RECORD_EXIT']

  const filteredVerifications = selectedCategory === 'ALL'
    ? verifications
    : verifications.filter((v) => v.category === selectedCategory)

  return (
    <div className="space-y-6 text-slate-900 font-sans">
      {/* 1. SECTION 1: OVERALL ASSESSMENT BANNER */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0f172a] to-[#1e293b] p-6 text-white shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700 mb-2">
              AUDIT VERDICT & ASSESSMENT
            </div>
            <h2 className="text-xl font-black text-[#38bdf8] leading-snug">{verdict}</h2>
            <p className="text-xs text-slate-300 mt-1">
              Subject: <span className="font-bold text-white">{investor_name}</span> {orgName && `• ${orgName}`} {desigName && `(${desigName})`}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="px-3.5 py-1 rounded-full text-xs font-black bg-cyan-500 text-slate-950 shadow-xs">
              {evidence_coverage_pct}% Evidence Coverage
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Timestamp: {new Date(investigation_timestamp || timestamp || Date.now()).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* 2. TWO-COLUMN HIGHLIGHTS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl bg-emerald-950/50 border border-emerald-800/60 p-3.5 space-y-2">
            <h4 className="font-bold text-emerald-300 flex items-center gap-1.5">
              <span>🟢 Strongly Corroborated Findings</span>
            </h4>
            <ul className="space-y-1 text-slate-200 text-[11px] list-disc list-inside">
              {strongly_corroborated.length > 0 ? (
                strongly_corroborated.map((item, i) => <li key={i}>{item}</li>)
              ) : (
                <li>No strongly corroborated claims retrieved in public index budget.</li>
              )}
            </ul>
          </div>

          <div className="rounded-xl bg-amber-950/50 border border-amber-800/60 p-3.5 space-y-2">
            <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>🟡 Items Requiring Verification</span>
            </h4>
            <ul className="space-y-1 text-slate-200 text-[11px] list-disc list-inside">
              {requires_verification.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 3. RISK & DISAMBIGUATION CALLOUT FLAGS */}
      {risk_flags.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-2 text-xs">
          <h4 className="font-bold text-amber-950 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-700" />
            <span>Risk Flags & Homonym Warnings</span>
          </h4>
          <ul className="space-y-1 text-amber-900 text-[11px] list-disc list-inside font-medium">
            {risk_flags.map((flag, idx) => (
              <li key={idx}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 4. CORROBORATION METRICS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
          <span className="text-2xl font-black text-slate-900 block">{total_claims}</span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Claims</span>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 shadow-xs">
          <span className="text-2xl font-black text-emerald-800 block">{verified_count}</span>
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Verified</span>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 shadow-xs">
          <span className="text-2xl font-black text-amber-800 block">{partially_verified_count}</span>
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Partial</span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-xs">
          <span className="text-2xl font-black text-slate-700 block">{unverified_count}</span>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unverified</span>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 shadow-xs col-span-2 sm:col-span-1">
          <span className="text-2xl font-black text-red-800 block">{contradicted_count}</span>
          <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider">Contradicted</span>
        </div>
      </div>

      {/* 5. CONTRADICTIONS & DISCREPANCIES ALERT BOXES */}
      {contradictions.length > 0 && (
        <div className="rounded-2xl border border-red-300 bg-red-50 p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-red-950 flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-red-700" />
            Contradiction & Discrepancy Detection ({contradictions.length})
          </h3>
          <div className="space-y-2">
            {contradictions.map((c, i) => (
              <div key={i} className="rounded-xl bg-white p-3.5 border border-red-200 text-xs space-y-1 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-900 uppercase text-[10px]">{c.flag_type}</span>
                  <span className="px-2 py-0.2 rounded text-[9px] font-black bg-red-100 text-red-800">SEVERITY: {c.severity}</span>
                </div>
                <p className="font-semibold text-slate-900 text-xs">{c.claim_text}</p>
                <p className="text-[11px] text-slate-600 italic">" {c.evidence_excerpt} "</p>
                <p className="text-[11px] text-red-800 font-medium pt-1">Reason: {c.reasoning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. IDENTITY RESOLUTION & HOMONYM RISK CARD */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-emerald-700" />
          Identity Resolution & Homonym Disambiguation
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">Identity Confidence</span>
            <span className="text-sm font-black text-slate-900 mt-0.5 block">{identity_confidence}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">Homonym Collision Risk</span>
            <span className={`text-sm font-black mt-0.5 block ${homonym_collision_risk === 'HIGH' ? 'text-amber-700' : 'text-emerald-700'}`}>
              {homonym_collision_risk}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-500 block uppercase">Distinct Public Hosts</span>
            <span className="text-sm font-black text-slate-900 mt-0.5 block">{distinct_public_hosts.length} Hosts Indexed</span>
          </div>
        </div>
      </div>

      {/* 7. REGULATORY ADAPTERS GRID */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Building className="w-4 h-4 text-emerald-700" />
          Indian Statutory Regulatory Registry Adapters (MCA, SEBI, RBI, IBBI)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {regulatory_checks.map((reg, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">{reg.authority}</span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded ${
                    reg.status === 'MATCHED' || reg.status === 'PUBLIC_INDEX_MATCH'
                      ? 'bg-emerald-100 text-emerald-800'
                      : reg.status === 'NOT_APPLICABLE'
                      ? 'bg-slate-100 text-slate-700'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {reg.badge_label || reg.status}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-800">{reg.summary}</p>
              <p className="text-[11px] text-slate-500 leading-normal">{reg.detail_reason}</p>
              {reg.source_url && (
                <a
                  href={reg.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline pt-1"
                >
                  View Regulatory Link <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 8. 3-PART INVESTMENT CARDS BREAKDOWN */}
      {investment_evaluations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-emerald-700" />
            3-Part Investment History & Cap-Table Evaluations ({investment_evaluations.length})
          </h3>

          <div className="space-y-3">
            {investment_evaluations.map((item, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Part 1: CV Claim */}
                <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-slate-100 pr-0 md:pr-4 pb-3 md:pb-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Part 1: CV Claim</span>
                  <p className="font-bold text-slate-900 text-sm">{item.company_name}</p>
                  {item.claimed_amount && <p className="text-slate-600 font-semibold">Cheque: {item.claimed_amount}</p>}
                </div>

                {/* Part 2: Independent Evidence & Tier Badges */}
                <div className="space-y-2 border-b md:border-b-0 md:border-r border-slate-100 pr-0 md:pr-4 pb-3 md:pb-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Part 2: Retrieved Evidence</span>
                  {item.sources && item.sources.length > 0 ? (
                    item.sources.map((s, sIdx) => (
                      <div key={sIdx} className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          {getSourceTierBadge(s.tier)}
                          <a href={s.url} target="_blank" rel="noreferrer" className="font-bold text-emerald-800 hover:underline truncate text-[11px]">
                            {s.name}
                          </a>
                        </div>
                        <p className="text-[10px] text-slate-500 italic line-clamp-2">"{s.excerpt}"</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No web sources retrieved within search budget.</p>
                  )}
                </div>

                {/* Part 3: Final Assessment & Note */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Part 3: Assessment & Note</span>
                  {getStatusBadge(item.final_status)}
                  <p className="text-[11px] text-slate-600 leading-normal">{item.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9. CLAIMS ACCORDION LIST */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <FileCheck className="w-4 h-4 text-emerald-700" />
            Atomic Extracted Claims & Evidence Audit Trail ({filteredVerifications.length})
          </h3>

          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0f3d2e] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredVerifications.map((v, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {v.category.replace('_', ' ')}
                  </span>
                  <span className="font-semibold text-xs text-slate-900">{v.claim_text}</span>
                </div>

                {getStatusBadge(v.status)}
              </div>

              <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="font-bold text-slate-800">Verification Notes: </span>
                {v.verification_notes}
              </div>

              {v.source_citations && v.source_citations.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-700 block">Citations & Authority Tiers:</span>
                  <div className="space-y-1">
                    {v.source_citations.map((cit, cIdx) => (
                      <div key={cIdx} className="flex flex-wrap items-center gap-2 text-[11px]">
                        {getSourceTierBadge(cit.tier)}
                        <a href={cit.url} target="_blank" rel="noreferrer" className="font-semibold text-emerald-800 hover:underline inline-flex items-center gap-1">
                          {cit.name} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 10. AGENT EXECUTION TRACE */}
      {activity_trace && activity_trace.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setShowTrace(!showTrace)}
            className="w-full px-5 py-3.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition cursor-pointer border-b border-slate-200"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Activity className="w-4 h-4 text-emerald-700" />
              <span>Multi-Agent Workflow Activity Trace ({activity_trace.length} Steps)</span>
            </div>
            {showTrace ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {showTrace && (
            <div className="p-4 bg-slate-900 text-slate-200 font-mono text-[11px] space-y-2 max-h-72 overflow-y-auto">
              {activity_trace.map((step, sIdx) => (
                <div key={sIdx} className="flex items-start gap-2 border-b border-slate-800 pb-1.5">
                  <span className="text-emerald-400 font-bold shrink-0">[{step.agent_name}]</span>
                  <span className="text-slate-400 shrink-0">{step.action}:</span>
                  <span className="text-slate-200">{step.detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 11. LEGAL DISCLAIMER & DOWNLOAD JSON BUTTON */}
      <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-amber-950">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-amber-950 text-xs">Statutory Legal Disclaimer & Defamation Risk Notice</h4>
            <p className="text-[11px] text-amber-900 leading-relaxed">{disclaimer}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleDownloadJson}
          className="shrink-0 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export DueDiligence JSON</span>
        </button>
      </div>
    </div>
  )
}
