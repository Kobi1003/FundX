import { useEffect, useState } from 'react'
import { useAuthContext } from '../../context/AuthContext'
import api from '../../services/api'
import VerificationBadge from '../../components/VerificationBadge'

export default function StartupVerifierPage() {
  const { user, updateActiveUser } = useAuthContext()
  const [startup, setStartup] = useState(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [auditStep, setAuditStep] = useState(0)
  const [report, setReport] = useState(null)
  const [alert, setAlert] = useState(null)

  const startupId = user?.startup_id || 'startup-aerogrid'

  useEffect(() => {
    api
      .getStartup(startupId)
      .then((data) => {
        setStartup(data)
        if (data?.verification_report) {
          setReport(data.verification_report)
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [startupId])

  const steps = [
    'Validating GSTIN checksum against Central Board of Indirect Taxes (CBIC)...',
    'Cross-referencing Certificate of Incorporation with ROC database...',
    'Checking sector compliance guidelines & sanction registries...',
    'Evaluating founding team corporate disclosures & legal standing...',
    'Generating AI verification audit report & risk certification...',
  ]

  const handleRunVerification = async () => {
    setVerifying(true)
    setAuditStep(0)
    setAlert(null)

    // Simulate animated step progress for high-polish WOW effect
    const timer = setInterval(() => {
      setAuditStep((prev) => {
        if (prev < steps.length - 1) return prev + 1
        return prev
      })
    }, 650)

    try {
      const res = await api.verifyStartup(startupId)
      clearInterval(timer)
      setReport(res.report)
      setStartup((prev) => ({
        ...prev,
        is_verified: res.is_verified,
        verification_status: res.verification_status,
        verification_score: res.verification_score,
      }))
      updateActiveUser({ is_verified: res.is_verified })
      setAlert({
        type: 'success',
        text: `Company background verified! Compliance Score: ${res.verification_score}/100 • AI Verified badge awarded!`,
      })
    } catch (err) {
      clearInterval(timer)
      setAlert({ type: 'error', text: `Verification failed: ${err.message}` })
    } finally {
      setVerifying(false)
    }
  }

  const isVerified = Boolean(startup?.is_verified)

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-0.5 mb-1.5">
            Autonomous Trust & Compliance Engine
          </div>
          <h1 className="text-2xl font-bold text-slate-900">AI Company Background Verifier</h1>
          <p className="text-sm text-slate-500 mt-1">
            Run automated statutory compliance scans on your GSTIN, corporate ROC filings, and regulatory standing to earn the platform-wide <span className="font-semibold text-emerald-700">AI Verified</span> badge.
          </p>
        </div>

        <VerificationBadge isVerified={isVerified} size="lg" />
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

      {/* Main Grid: Credentials Left, Scan & Report Right */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Current Company Filing Info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Registered Credentials
          </h2>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Entity Name</span>
              <div className="font-bold text-slate-900 mt-0.5 text-sm">{startup?.name || 'AeroGrid Tech'}</div>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Sector & Stage</span>
              <div className="font-medium text-slate-700 mt-0.5">
                {startup?.industry || 'CleanTech'} • {startup?.stage || 'Seed'}
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold">GSTIN Registry Identifier</span>
              <div className="font-mono font-bold text-slate-900 bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1">
                {startup?.gst_number || '27AABCA1234F1Z8'}
              </div>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Incorporation Certificate</span>
              <div className="font-mono text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-200 mt-1 truncate">
                📄 {startup?.incorporation_cert || 'AEROGRID_INCORPORATION_ROC_2024.pdf'}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-400 text-[10px] uppercase font-semibold">Verification State</span>
              <div className="mt-1">
                <VerificationBadge isVerified={isVerified} size="md" />
              </div>
            </div>
          </div>
        </div>

        {/* Right 2 cols: Verifier Scan Engine & Live Audit Report */}
        <div className="md:col-span-2 space-y-6">
          {/* Action Trigger Card */}
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-slate-50 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {isVerified ? 'Re-Verify Background Credentials' : 'Verify Company Background'}
                </h3>
                <p className="text-xs text-slate-600 mt-1">
                  Initiate agentic multi-point audit of corporate documents, GST tax filings, and legal standing.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunVerification}
                disabled={verifying}
                className="rounded-xl bg-[#0f3d2e] hover:bg-[#165540] text-white px-5 py-3 text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
              >
                {verifying ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" strokeWidth="3" strokeOpacity="0.3" />
                      <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="3" />
                    </svg>
                    <span>Auditing Registry...</span>
                  </>
                ) : (
                  <>
                    <span>⚡ Run AI Background Check</span>
                  </>
                )}
              </button>
            </div>

            {/* Scan animation progress bar */}
            {verifying && (
              <div className="mt-5 space-y-2">
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${((auditStep + 1) / steps.length) * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-800 font-mono">
                  <span className="animate-spin text-emerald-600">✦</span>
                  <span>{steps[auditStep]}</span>
                </div>
              </div>
            )}
          </div>

          {/* Audit Results Card */}
          {report && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-bold text-base text-slate-900">AI Background Verification Audit Report</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Completed at: {report.timestamp ? new Date(report.timestamp).toLocaleString() : 'Just now'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Score</span>
                    <span className="text-xl font-black text-emerald-700">{report.score || 94}/100</span>
                  </div>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1">
                    {report.risk_level || 'LOW'} RISK
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-700 leading-relaxed border border-slate-100">
                <span className="font-bold text-slate-900 block mb-1">Executive Summary</span>
                {report.summary}
              </div>

              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">
                  Checkpoints & Compliance Matrix
                </h4>
                <div className="space-y-2.5">
                  {(report.audit_checks || []).map((chk, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-slate-200/80 p-3.5 flex items-start justify-between gap-4 bg-white"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                          <span className="text-emerald-600">✓</span>
                          <span>{chk.check}</span>
                        </div>
                        <p className="text-xs text-slate-500 pl-4">{chk.detail}</p>
                      </div>
                      <span
                        className={`font-black text-[10px] px-2 py-0.5 rounded-md ${
                          chk.status === 'PASS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {chk.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
