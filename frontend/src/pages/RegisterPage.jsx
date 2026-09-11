import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Upload, FileCheck, FileText, CheckCircle2, AlertCircle, Loader } from 'lucide-react'
import { useAuthContext } from '../context/AuthContext'
import api from '../services/api'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setUser } = useAuthContext()

  const initialRole = searchParams.get('role') === 'investor' ? 'investor' : 'startup'
  const [roleTab, setRoleTab] = useState(initialRole)
  const [certFile, setCertFile] = useState(null)

  useEffect(() => {
    const paramRole = searchParams.get('role')
    if (paramRole === 'investor' || paramRole === 'startup') {
      setRoleTab(paramRole)
    }
  }, [searchParams])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const lower = file.name.toLowerCase()
      const ok =
        file.type === 'application/pdf' ||
        lower.endsWith('.pdf') ||
        lower.endsWith('.txt') ||
        lower.endsWith('.md')
      if (!ok) {
        setError('Please select a PDF or text document for your Incorporation Certificate.')
        return
      }
      setCertFile(file)
      setError(null)
      setStartupForm((prev) => ({
        ...prev,
        incorporation_cert: file.name,
      }))
    }
  }

  // Startup form fields
  const [startupForm, setStartupForm] = useState({
    name: '',
    email: '',
    password: '',
    industry: 'CleanTech',
    gst_number: '',
    cin: '',
    incorporation_cert: '',
  })

  // Investor form fields
  const [investorForm, setInvestorForm] = useState({
    name: '',
    email: '',
    password: '',
    cin: '',
    gst_number: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  
  // CIN / GST verification states
  const [startupCinVerifying, setStartupCinVerifying] = useState(false)
  const [startupCinResult, setStartupCinResult] = useState(null)
  const [startupGstVerifying, setStartupGstVerifying] = useState(false)
  const [startupGstResult, setStartupGstResult] = useState(null)
  const [investorCinVerifying, setInvestorCinVerifying] = useState(false)
  const [investorCinResult, setInvestorCinResult] = useState(null)

  // Debounce timers
  const [debounceTimer, setDebounceTimer] = useState(null)
  const [gstDebounceTimer, setGstDebounceTimer] = useState(null)

  const handleStartupCinChange = async (e) => {
    let cin = e.target.value.toUpperCase().trim()
    
    // Remove spaces and special characters, keep only alphanumeric
    cin = cin.replace(/[^A-Z0-9]/g, '')
    
    setStartupForm({ ...startupForm, cin })
    setStartupCinResult(null)

    // Clear existing timer
    if (debounceTimer) clearTimeout(debounceTimer)

    // Auto-verify after 500ms of typing if CIN looks valid (10+ chars)
    if (cin.length >= 10) {
      const timer = setTimeout(async () => {
        await verifyStartupCin(cin)
      }, 500)
      setDebounceTimer(timer)
    }
  }

  const verifyStartupCin = async (cin) => {
    if (!cin || cin.length < 10) return
    
    setStartupCinVerifying(true)
    try {
      const result = await api.verifyCin(cin)
      setStartupCinResult(result)
      
      // Auto-fill company name if verified
      if (result.verified && result.company) {
        setStartupForm((prev) => ({
          ...prev,
          name: result.company.company_name || prev.name,
        }))
      }
    } catch (err) {
      console.error('CIN verification error:', err)
      // Show error but allow manual verification path
      setStartupCinResult({
        verified: false,
        eligible: false,
        message: `Unable to verify at this moment: ${err.message || 'Service temporarily unavailable'}. You can continue with manual verification.`,
      })
    } finally {
      setStartupCinVerifying(false)
    }
  }

  const handleStartupGstChange = (e) => {
    const gst = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    setStartupForm({ ...startupForm, gst_number: gst })
    setStartupGstResult(null)
    if (gstDebounceTimer) clearTimeout(gstDebounceTimer)
    if (gst.length === 15) {
      const timer = setTimeout(async () => {
        setStartupGstVerifying(true)
        try {
          const result = await api.verifyGst(gst)
          setStartupGstResult(result)
          if (result.eligible && result.data?.legal_name) {
            setStartupForm((prev) => ({
              ...prev,
              name: prev.name || result.data.legal_name,
            }))
          }
        } catch (err) {
          setStartupGstResult({
            verified: false,
            eligible: false,
            message: err.message || 'GST verification failed',
          })
        } finally {
          setStartupGstVerifying(false)
        }
      }, 450)
      setGstDebounceTimer(timer)
    }
  }

  const handleInvestorCinChange = async (e) => {
    let cin = e.target.value.toUpperCase().trim()
    
    // Remove spaces and special characters, keep only alphanumeric
    cin = cin.replace(/[^A-Z0-9]/g, '')
    
    setInvestorForm({ ...investorForm, cin })
    setInvestorCinResult(null)

    // Clear existing timer
    if (debounceTimer) clearTimeout(debounceTimer)

    // Auto-verify after 500ms of typing if CIN looks valid (10+ chars)
    if (cin.length >= 10) {
      const timer = setTimeout(async () => {
        await verifyInvestorCin(cin)
      }, 500)
      setDebounceTimer(timer)
    }
  }

  const verifyInvestorCin = async (cin) => {
    if (!cin || cin.length < 10) return
    
    setInvestorCinVerifying(true)
    try {
      const result = await api.verifyCin(cin)
      setInvestorCinResult(result)
    } catch (err) {
      console.error('CIN verification error:', err)
      // Show error but allow manual verification path
      setInvestorCinResult({
        verified: false,
        eligible: false,
        message: `Unable to verify at this moment: ${err.message || 'Service temporarily unavailable'}. You can continue with manual verification.`,
      })
    } finally {
      setInvestorCinVerifying(false)
    }
  }

  const handleStartupSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // Validate required fields
    if (!startupForm.name || !startupForm.email || !startupForm.password) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    // Soft-block clearly ineligible CIN / GST before submit
    if (startupForm.cin && startupCinResult && !startupCinResult.eligible) {
      setError(startupCinResult.message || 'CIN is not eligible for registration')
      setLoading(false)
      return
    }
    if (startupForm.gst_number && startupForm.gst_number.length === 15 && startupGstResult && startupGstResult.source === 'gstverify' && !startupGstResult.eligible) {
      setError(startupGstResult.message || 'GSTIN is not Active / eligible')
      setLoading(false)
      return
    }

    const certName = certFile
      ? certFile.name
      : startupForm.incorporation_cert || `${(startupForm.name || 'COMPANY').toUpperCase().replace(/\s+/g, '_')}_INCORPORATION_ROC.pdf`

    try {
      const res = await api.register({
        role: 'startup',
        ...startupForm,
        incorporation_cert: certName,
      })
      // Persist bytes to repo uploads/ when a real file was chosen
      const startupId = res.user?.startup_id || res.startup_id || res.user?.id
      if (certFile && startupId) {
        try {
          await api.uploadStartupDocument(startupId, certFile, 'incorporation')
        } catch (uploadErr) {
          console.warn('Incorporation file upload deferred:', uploadErr)
        }
      }
      setUser(res.user)
      setSuccess('Startup account registered successfully!')
      setTimeout(() => navigate('/startup/dashboard'), 800)
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
      console.error('Registration error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInvestorSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    // Validate required fields
    if (!investorForm.name || !investorForm.email || !investorForm.password) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    try {
      const res = await api.register({
        role: 'investor',
        ...investorForm,
      })
      setUser(res.user)
      setSuccess('Investor account registered successfully!')
      setTimeout(() => navigate('/investor/dashboard'), 800)
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
      console.error('Registration error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto py-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-md">
        {/* Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <img src="/logoidea.jpeg" alt="FundX Logo" className="h-14 w-auto mb-3 object-contain rounded-lg" />
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Create Your FundX Account</h1>
          <p className="text-xs text-slate-500 mt-1">
            Choose your account role to join the autonomous investment arena
          </p>
        </div>

        {/* Role Tab Switcher */}
        <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200">
          <button
            type="button"
            onClick={() => setRoleTab('startup')}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
              roleTab === 'startup'
                ? 'bg-[#0f3d2e] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🚀 Startup Registration
          </button>
          <button
            type="button"
            onClick={() => setRoleTab('investor')}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition cursor-pointer ${
              roleTab === 'investor'
                ? 'bg-[#0f3d2e] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💼 Investor Registration
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 mb-4">
            {success}
          </div>
        )}

        {/* Startup Registration Form */}
        {roleTab === 'startup' && (
          <form onSubmit={handleStartupSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company / Founder Name</label>
              <input
                type="text"
                required
                placeholder="e.g. AeroGrid Tech"
                value={startupForm.name}
                onChange={(e) => setStartupForm({ ...startupForm, name: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Work Email</label>
              <input
                type="email"
                required
                placeholder="founder@aerogrid.io"
                value={startupForm.email}
                onChange={(e) => setStartupForm({ ...startupForm, email: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={startupForm.password}
                onChange={(e) => setStartupForm({ ...startupForm, password: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Industry Sector</label>
              <select
                value={startupForm.industry}
                onChange={(e) => setStartupForm({ ...startupForm, industry: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="CleanTech">CleanTech & Energy</option>
                <option value="FinTech">FinTech & Payments</option>
                <option value="HealthTech">HealthTech & Bio</option>
                <option value="Robotics">Robotics & Industrial Automation</option>
                <option value="AI / DeepTech">AI / DeepTech</option>
                <option value="B2B SaaS">B2B SaaS</option>
              </select>
            </div>

            {/* CIN Verification Section for Startups */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                🏢 Corporate CIN <span className="text-amber-600 font-normal">(Instant Verification)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. U40100WB2022PTC256639"
                  value={startupForm.cin}
                  onChange={handleStartupCinChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono font-bold text-slate-900 uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                {startupCinVerifying && (
                  <Loader className="absolute right-3 top-2.5 h-5 w-5 text-slate-400 animate-spin" />
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                21-digit Ministry of Corporate Affairs (MCA) / Registrar of Companies (ROC) identifier
              </span>

              {/* CIN Verification Result for Startups */}
              {startupCinResult && (
                <div className={`rounded-xl border p-3 mt-2 ${
                  startupCinResult.eligible
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-amber-300 bg-amber-50'
                }`}>
                  <div className="flex items-start gap-2">
                    {startupCinResult.eligible ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={`text-xs font-bold ${
                        startupCinResult.eligible ? 'text-emerald-900' : 'text-amber-900'
                      }`}>
                        {startupCinResult.eligible ? '✅ Verified & Eligible' : '⚠️ Not Eligible'}
                      </p>
                      <p className={`text-[11px] mt-1 ${
                        startupCinResult.eligible ? 'text-emerald-800' : 'text-amber-800'
                      }`}>
                        {startupCinResult.message}
                      </p>
                      {startupCinResult.company && (
                        <div className={`mt-2 p-2 rounded-lg ${
                          startupCinResult.eligible ? 'bg-emerald-100' : 'bg-amber-100'
                        }`}>
                          <p className="text-[10px] font-bold text-slate-900">
                            {startupCinResult.company.company_name}
                          </p>
                          {startupCinResult.company.registration_date && (
                            <p className="text-[10px] text-slate-600">
                              Registered: {new Date(startupCinResult.company.registration_date).toLocaleDateString()}
                            </p>
                          )}
                          {startupCinResult.company.paidup_capital && (
                            <p className="text-[10px] text-slate-600">
                              Paid-up Capital: ₹{(startupCinResult.company.paidup_capital / 100000).toFixed(1)}L
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                GST Number (GSTIN) <span className="text-amber-600 font-normal">(Live GSTVerify)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. 27AABCA1234F1Z5"
                  value={startupForm.gst_number}
                  onChange={handleStartupGstChange}
                  maxLength={15}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono font-bold text-slate-900 uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                {startupGstVerifying && (
                  <Loader className="absolute right-3 top-2.5 h-5 w-5 text-slate-400 animate-spin" />
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                15-digit GSTIN verified via gstverify.co.in when GSTVERIFY_API_KEY is set
              </span>
              {startupGstResult && (
                <div className={`rounded-xl border p-3 mt-2 ${
                  startupGstResult.eligible
                    ? 'border-emerald-300 bg-emerald-50'
                    : startupGstResult.needs_api_key
                      ? 'border-slate-300 bg-slate-50'
                      : 'border-amber-300 bg-amber-50'
                }`}>
                  <div className="flex items-start gap-2">
                    {startupGstResult.eligible ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={`text-xs font-bold ${
                        startupGstResult.eligible ? 'text-emerald-900' : 'text-amber-900'
                      }`}>
                        {startupGstResult.eligible
                          ? 'GSTIN Verified (Active)'
                          : startupGstResult.needs_api_key
                            ? 'Format OK — API key needed for live check'
                            : 'GST verification issue'}
                      </p>
                      <p className="text-[11px] mt-1 text-slate-700">{startupGstResult.message}</p>
                      {startupGstResult.data?.legal_name && (
                        <p className="text-[10px] font-bold text-slate-900 mt-2 p-2 rounded bg-white/70">
                          {startupGstResult.data.legal_name}
                          {startupGstResult.data.state ? ` · ${startupGstResult.data.state}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Incorporation Certificate <span className="text-emerald-700 font-normal">(PDF required)</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  id="inc-cert-upload"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="inc-cert-upload"
                  className={`flex items-center justify-between gap-3 w-full rounded-xl border-2 border-dashed p-3.5 cursor-pointer transition ${
                    certFile
                      ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 shadow-2xs'
                      : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-emerald-500 text-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                        certFile ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {certFile ? <FileCheck className="h-5 w-5" /> : <Upload className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate text-slate-900">
                        {certFile ? certFile.name : 'Upload Incorporation Certificate (.pdf)'}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {certFile
                          ? `${(certFile.size / 1024).toFixed(1)} KB • Attached for AI ROC verification`
                          : 'Click to choose or drag & drop ROC filing document'}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-2xs shrink-0 hover:bg-slate-50">
                    {certFile ? 'Change PDF' : 'Upload PDF'}
                  </span>
                </label>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Official Registrar of Companies (ROC) Incorporation filing document in PDF format
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#0f3d2e] hover:bg-[#165540] text-white py-3 text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating Startup Account...' : 'Register Startup Account →'}
            </button>
          </form>
        )}

        {/* Investor Registration Form */}
        {roleTab === 'investor' && (
          <form onSubmit={handleInvestorSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Vikram Mehta"
                value={investorForm.name}
                onChange={(e) => setInvestorForm({ ...investorForm, name: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="investor@nexusangels.io"
                value={investorForm.email}
                onChange={(e) => setInvestorForm({ ...investorForm, email: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={investorForm.password}
                onChange={(e) => setInvestorForm({ ...investorForm, password: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* CIN Verification Section for Investors */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                🏢 Corporate CIN / Entity ID <span className="text-amber-600 font-normal">(Instant Verification)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. U40100WB2022PTC256639"
                  value={investorForm.cin}
                  onChange={handleInvestorCinChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono font-bold text-slate-900 uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                {investorCinVerifying && (
                  <Loader className="absolute right-3 top-2.5 h-5 w-5 text-slate-400 animate-spin" />
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Corporate investors: Register with MCA/ROC CIN for instant dealroom access and buying rights
              </span>

              {/* CIN Verification Result for Investors */}
              {investorCinResult && (
                <div className={`rounded-xl border p-3 mt-2 ${
                  investorCinResult.eligible
                    ? 'border-emerald-300 bg-emerald-50'
                    : 'border-amber-300 bg-amber-50'
                }`}>
                  <div className="flex items-start gap-2">
                    {investorCinResult.eligible ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className={`text-xs font-bold ${
                        investorCinResult.eligible ? 'text-emerald-900' : 'text-amber-900'
                      }`}>
                        {investorCinResult.eligible ? '✅ Verified Institutional Entity' : '⚠️ Not Eligible'}
                      </p>
                      <p className={`text-[11px] mt-1 ${
                        investorCinResult.eligible ? 'text-emerald-800' : 'text-amber-800'
                      }`}>
                        {investorCinResult.message}
                      </p>
                      {investorCinResult.eligible && (
                        <p className="text-[10px] font-bold text-emerald-800 mt-2 p-2 bg-emerald-100 rounded">
                          🎯 Instant Dealroom & Buying Access Unlocked!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">GST Number (GSTIN) <span className="font-normal text-slate-500">(Optional)</span></label>
              <input
                type="text"
                placeholder="e.g. 27AABCA1234F1Z8"
                value={investorForm.gst_number}
                onChange={(e) => setInvestorForm({ ...investorForm, gst_number: e.target.value.toUpperCase() })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono font-bold text-slate-900 uppercase focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600">
              ℹ️ <span className="font-bold">Corporate Investors:</span> Register with a valid CIN for instant verification. <span className="font-bold">Individual Investors:</span> After registration, upload your CV in your profile to complete AI accreditation and unlock Dealroom negotiations.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#0f3d2e] hover:bg-[#165540] text-white py-3 text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating Investor Account...' : 'Register Investor Account →'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-emerald-800 hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </div>
  )
}
