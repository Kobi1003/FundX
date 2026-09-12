import { useEffect, useState } from 'react'
import { useAuthContext } from '../../context/AuthContext'
import api from '../../services/api'
import VerificationBadge from '../../components/VerificationBadge'
import InvestorDueDiligenceReportView from '../../components/InvestorDueDiligenceReportView'
import { BentoGrid, BentoItem } from '../../components/BentoGrid'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { FileText, Upload, Sparkles, CheckCircle, Loader2, ShieldCheck } from 'lucide-react'

export default function InvestorProfilePage() {
  const { user, updateActiveUser } = useAuthContext()

  const [form, setForm] = useState({
    display_name: user?.full_name || '',
    email: user?.email || '',
    firm: user?.firm || '',
    bio: '',
    cv_filename: '',
    cv_text: '',
  })

  const [preferences, setPreferences] = useState({
    industries: ['CleanTech', 'FinTech', 'AI / DeepTech'],
    stages: ['Seed', 'Series A'],
    check_size_min: 100000,
    check_size_max: 1000000,
    geographies: ['Global', 'North America', 'India'],
    notes: '',
  })

  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [alert, setAlert] = useState(null)

  const investorId = user?.investor_id || 'investor-elena'
  const isVerified = Boolean(user?.is_verified)

  useEffect(() => {
    api
      .getInvestor(investorId)
      .then((data) => {
        if (data) {
          setForm({
            display_name: data.display_name || user?.full_name || '',
            email: data.email || user?.email || '',
            firm: data.firm || '',
            bio: data.bio || '',
            cv_filename: data.cv_filename || '',
            cv_text: data.cv_text || '',
          })
          if (data.preferences) setPreferences((p) => ({ ...p, ...data.preferences }))
          if (data.verification_report) setReport(data.verification_report)
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [investorId, user])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setAlert(null)
    try {
      await api.updateInvestor(investorId, form)
      await api.updateInvestorPreferences(investorId, preferences)
      updateActiveUser({
        full_name: form.display_name,
        firm: form.firm,
      })
      setAlert({ type: 'success', text: 'Profile and investment preferences saved!' })
    } catch (err) {
      setAlert({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setAlert({ type: 'error', text: 'Please select a valid PDF file (.pdf).' })
      return
    }

    setUploadingPdf(true)
    setAlert(null)

    try {
      const res = await api.uploadInvestorCvFile(investorId, file)
      setForm((prev) => ({
        ...prev,
        cv_filename: res.cv_filename || file.name,
        cv_text: res.cv_text || '',
      }))
      setAlert({
        type: 'success',
        text: `PDF CV '${file.name}' uploaded successfully. Click Start verification to run due diligence.`,
      })
    } catch {
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result
        setForm((prev) => ({
          ...prev,
          cv_filename: file.name,
          cv_text: typeof text === 'string' ? text : `Uploaded PDF CV (${file.name}).`,
        }))
      }
      reader.readAsText(file)
      setAlert({
        type: 'success',
        text: `PDF CV '${file.name}' attached. Click Start verification to run due diligence.`,
      })
    } finally {
      setUploadingPdf(false)
    }
  }

  const handleRunVerification = async () => {
    if (!form.cv_filename && !form.cv_text) {
      setAlert({ type: 'error', text: 'Please upload your PDF CV file before running verification.' })
      return
    }

    setVerifying(true)
    setAlert(null)
    try {
      await api.updateInvestor(investorId, form)
      const res = await api.verifyInvestor(investorId)
      setReport(res.report)
      updateActiveUser({ is_verified: res.is_verified })
      setAlert({
        type: 'success',
        text: `Due diligence complete. Status: ${res.overall_status || 'VERIFIED'} · Evidence: ${res.overall_evidence_strength || 'HIGH'}`,
      })
    } catch (err) {
      setAlert({ type: 'error', text: `Verification failed: ${err.message}` })
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="space-y-4 pb-8">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">Investor verification</h1>
              <VerificationBadge isVerified={isVerified} size="md" />
            </div>
            <CardDescription>
              Upload a PDF CV for multi-agent due diligence, PII redaction, and registry checks.
            </CardDescription>
          </div>
          <Badge variant="secondary">Profile & CV</Badge>
        </CardHeader>
      </Card>

      {alert && (
        <Card className={alert.type === 'success' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="flex items-center justify-between gap-3 p-4 text-sm">
            <span>{alert.text}</span>
            <Button variant="ghost" size="sm" onClick={() => setAlert(null)}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      <BentoGrid>
        <BentoItem className="md:col-span-6 xl:col-span-5">
          <Card>
            <CardHeader>
              <CardTitle>Personal & firm</CardTitle>
              <CardDescription>These details appear on offers and the admin directory.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display name</Label>
                    <Input
                      id="display_name"
                      required
                      value={form.display_name}
                      onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                      placeholder="e.g. Rahul Sharma"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firm">Firm / syndicate</Label>
                    <Input
                      id="firm"
                      value={form.firm}
                      onChange={(e) => setForm({ ...form, firm: e.target.value })}
                      placeholder="e.g. Nexus Angel Syndicate"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="investor@firm.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Thesis & bio</Label>
                  <Textarea
                    id="bio"
                    rows={3}
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Track record, sectors, and stage preferences…"
                  />
                </div>

                <Separator />

                <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4" />
                      Investor CV (PDF)
                    </div>
                    {form.cv_filename && (
                      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
                        <CheckCircle className="size-3" />
                        PDF ready
                      </Badge>
                    )}
                  </div>

                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed bg-background p-6 text-center hover:bg-accent/40">
                    {uploadingPdf ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Extracting PDF text…
                      </div>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-muted-foreground" />
                        <p className="text-sm font-medium">
                          {form.cv_filename || 'Click to upload a PDF CV'}
                        </p>
                        <p className="text-xs text-muted-foreground">PDF up to 10MB</p>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handlePdfUpload}
                      disabled={uploadingPdf}
                      className="hidden"
                    />
                  </label>

                  {form.cv_text && (
                    <div className="space-y-2">
                      <Label htmlFor="cv_text">Extracted text</Label>
                      <Textarea
                        id="cv_text"
                        rows={4}
                        value={form.cv_text}
                        onChange={(e) => setForm({ ...form, cv_text: e.target.value })}
                        className="font-mono text-xs"
                      />
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleRunVerification}
                      disabled={verifying || (!form.cv_filename && !form.cv_text)}
                    >
                      {verifying ? <Loader2 className="animate-spin" /> : <Sparkles />}
                      {verifying ? 'Running due diligence…' : 'Start verification'}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <p className="text-sm font-medium">Ticket size</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="check_min">Min check ($)</Label>
                      <Input
                        id="check_min"
                        type="number"
                        value={preferences.check_size_min}
                        onChange={(e) =>
                          setPreferences({ ...preferences, check_size_min: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="check_max">Max check ($)</Label>
                      <Input
                        id="check_max"
                        type="number"
                        value={preferences.check_size_max}
                        onChange={(e) =>
                          setPreferences({ ...preferences, check_size_max: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving…' : 'Save profile'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </BentoItem>

        <BentoItem className="md:col-span-6 xl:col-span-7">
          {report ? (
            <InvestorDueDiligenceReportView report={report} />
          ) : (
            <Card className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
              <CardContent className="flex max-w-md flex-col items-center gap-3 py-16">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <ShieldCheck className="h-6 w-6 text-muted-foreground" />
                </div>
                <CardTitle>Verification report</CardTitle>
                <CardDescription>
                  Upload a PDF CV and start verification to fill this panel with identity, registry, and claim evidence.
                </CardDescription>
                {loading && <p className="text-xs text-muted-foreground">Loading investor profile…</p>}
              </CardContent>
            </Card>
          )}
        </BentoItem>
      </BentoGrid>
    </div>
  )
}
