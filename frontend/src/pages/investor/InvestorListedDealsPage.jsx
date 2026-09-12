import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import api from '../../services/api'
import VerificationBadge from '../../components/VerificationBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Flame,
  Zap,
  Sprout,
  ShieldAlert,
  Search,
  Building2,
  Handshake,
  FileText,
} from 'lucide-react'

function thesisPdfUrl(deal) {
  const doc = deal?.thesis_doc || deal?.thesis_pdf || ''
  if (!doc) return null
  if (/^https?:\/\//i.test(doc)) return doc
  const name = doc.replace(/^.*[\\/]/, '')
  return `/theses/${encodeURIComponent(name)}`
}

function openThesisPdf(deal) {
  const url = thesisPdfUrl(deal)
  if (!url) return false
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}

function getDealInterestConfig(deal) {
  const status = deal.status || 'published'

  if (status === 'negotiating' || deal.id === 'deal-aerogrid' || (deal.interested_count && deal.interested_count >= 5)) {
    return {
      type: 'HOT',
      label: 'Hot',
      icon: Flame,
      badge: 'warning',
    }
  }

  if (deal.id === 'deal-finpulse' || deal.id === 'deal-quantumledger' || (deal.interested_count && deal.interested_count >= 2)) {
    return {
      type: 'MODERATE',
      label: 'Active',
      icon: Zap,
      badge: 'info',
    }
  }

  return {
    type: 'NEW',
    label: 'New',
    icon: Sprout,
    badge: 'success',
  }
}

export default function InvestorListedDealsPage() {
  const navigate = useNavigate()
  const { user } = useAuthContext()

  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [industryFilter, setIndustryFilter] = useState('all')
  const [stageFilter, setStageFilter] = useState('all')
  const [interestFilter, setInterestFilter] = useState('all')
  const [inspectDeal, setInspectDeal] = useState(null)
  const [showGatingModal, setShowGatingModal] = useState(false)
  const [alert, setAlert] = useState(null)

  const isVerified = Boolean(user?.is_verified)

  useEffect(() => {
    api
      .listDeals()
      .then((data) => {
        const marketDeals = (data || []).filter((d) => d.status !== 'draft')
        setDeals(marketDeals)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const handleNegotiateClick = (deal) => {
    if (!isVerified) {
      setShowGatingModal(true)
      return
    }
    navigate(`/investor/dealroom?dealId=${deal.id}`)
  }

  const handleExpressInterest = async (dealId) => {
    try {
      await api.expressInterest(dealId, {
        investor_id: user?.investor_id || 'investor-elena',
        investor_name: user?.full_name || 'Elena Rostova',
      })
      setAlert({ type: 'success', text: 'Interest registered. The founder has been notified.' })
    } catch (err) {
      setAlert({ type: 'error', text: err.message })
    }
  }

  const filtered = deals.filter((d) => {
    const config = getDealInterestConfig(d)
    const matchSearch =
      d.title?.toLowerCase().includes(search.toLowerCase()) ||
      d.pitch?.toLowerCase().includes(search.toLowerCase()) ||
      d.startup_name?.toLowerCase().includes(search.toLowerCase())
    const matchIndustry = industryFilter === 'all' || d.industry === industryFilter
    const matchStage = stageFilter === 'all' || d.funding_stage === stageFilter
    const matchInterest =
      interestFilter === 'all' ||
      (interestFilter === 'hot' && config.type === 'HOT') ||
      (interestFilter === 'moderate' && config.type === 'MODERATE') ||
      (interestFilter === 'new' && config.type === 'NEW')

    return matchSearch && matchIndustry && matchStage && matchInterest
  })

  const industries = ['all', ...new Set(deals.map((d) => d.industry).filter(Boolean))]
  const stages = ['all', 'Pre-Seed', 'Seed', 'Series A', 'Series B']
  const hotCount = deals.filter((d) => getDealInterestConfig(d).type === 'HOT').length
  const moderateCount = deals.filter((d) => getDealInterestConfig(d).type === 'MODERATE').length
  const newCount = deals.filter((d) => getDealInterestConfig(d).type === 'NEW').length

  return (
    <div className="space-y-3 pb-6">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight">Listed deals</h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
              Live
            </span>
            <VerificationBadge isVerified={isVerified} size="sm" />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {deals.length} rounds · {hotCount} hot · {newCount} new
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1.5 text-[11px]">
            <span className="rounded-md border bg-muted/60 px-2 py-1 tabular-nums">{deals.length} live</span>
            <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 tabular-nums text-amber-900">{hotCount} hot</span>
            <span className="rounded-md border border-sky-200 bg-sky-50 px-2 py-1 tabular-nums text-sky-900">{newCount} new</span>
          </div>
          {!isVerified && (
            <Button asChild size="sm" className="h-8 text-xs">
              <Link to="/investor/profile">Verify CV</Link>
            </Button>
          )}
        </div>
      </div>

      {alert && (
        <Card className={alert.type === 'success' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="flex items-center justify-between gap-3 p-3 text-xs">
            <span>{alert.text}</span>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setAlert(null)}>Dismiss</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-2 p-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search startup, pitch, tech…"
                className="h-8 pl-8 text-xs"
              />
            </div>
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              {industries.map((ind) => (
                <option key={ind} value={ind}>{ind === 'all' ? 'All industries' : ind}</option>
              ))}
            </select>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
            >
              {stages.map((stg) => (
                <option key={stg} value={stg}>{stg === 'all' ? 'All stages' : stg}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: `All (${deals.length})` },
              { id: 'hot', label: `Hot (${hotCount})` },
              { id: 'moderate', label: `Active (${moderateCount})` },
              { id: 'new', label: `New (${newCount})` },
            ].map((pill) => (
              <Button
                key={pill.id}
                type="button"
                size="sm"
                className="h-7 px-2.5 text-[11px]"
                variant={interestFilter === pill.id ? 'default' : 'outline'}
                onClick={() => setInterestFilter(pill.id)}
              >
                {pill.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((deal) => {
          const config = getDealInterestConfig(deal)
          const Icon = config.icon
          const isHot = config.type === 'HOT'
          return (
            <Card
              key={deal.id}
              className={`flex flex-col gap-0 overflow-hidden py-0 shadow-sm transition hover:border-primary/40 ${
                isHot ? 'ring-1 ring-amber-300/60' : ''
              }`}
            >
              <CardHeader className="space-y-1.5 p-3 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={config.badge} className="h-5 gap-1 px-1.5 text-[10px]">
                    <Icon className="size-2.5" />
                    {config.label}
                    {isHot && <span className="ml-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{deal.funding_stage || 'Seed'}</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <CardTitle className="flex items-center gap-1 text-sm leading-tight">
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{deal.startup_name}</span>
                    </CardTitle>
                    <VerificationBadge isVerified={deal.startup_verified} size="sm" />
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs font-medium leading-snug text-foreground/90">{deal.title}</p>
                  <CardDescription className="mt-0.5 line-clamp-1 text-[11px]">{deal.pitch}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 px-3 pb-2">
                <div className="grid grid-cols-3 gap-1 rounded-md bg-muted/50 px-2 py-1.5 text-center">
                  <div>
                    <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Target</p>
                    <p className="text-xs font-semibold tabular-nums">${(Number(deal.target_raise) || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Equity</p>
                    <p className="text-xs font-semibold text-emerald-800">{deal.equity_pct}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-wide text-muted-foreground">Royalty</p>
                    <p className="text-xs font-semibold text-amber-800">{deal.royalty_pct || 0}%</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">AI score</span>
                  <span className="font-medium tabular-nums">{deal.ai_score ? `${deal.ai_score}/100` : '88/100'}</span>
                </div>
              </CardContent>
              <CardFooter className="mt-auto gap-1.5 border-t bg-muted/20 p-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => {
                    if (!openThesisPdf(deal)) setInspectDeal(deal)
                  }}
                >
                  <FileText className="size-3" />
                  Thesis
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => {
                    const doc = (deal.thesis_doc || '').replace(/^.*[\\/]/, '')
                    if (doc) navigate(`/simulation?thesisDoc=${encodeURIComponent(doc)}`)
                    else navigate('/simulation')
                  }}
                >
                  Simulate
                </Button>
                <Button size="sm" className="h-7 flex-1 text-[11px]" onClick={() => handleNegotiateClick(deal)}>
                  <Handshake className="size-3" />
                  {isVerified ? 'Dealroom' : 'Verify'}
                </Button>
              </CardFooter>
            </Card>
          )
        })}

        {(loading || filtered.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center text-xs text-muted-foreground">
              {loading ? 'Loading marketplace rounds…' : 'No deals match the current filters.'}
            </CardContent>
          </Card>
        )}
      </div>

      {inspectDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
            <CardHeader className="flex flex-row items-start justify-between p-4">
              <div>
                <CardDescription className="text-xs">{inspectDeal.funding_stage} · {inspectDeal.industry}</CardDescription>
                <CardTitle className="mt-1 text-base">{inspectDeal.title}</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setInspectDeal(null)}>Close</Button>
            </CardHeader>
            <CardContent className="space-y-3 p-4 pt-0">
              <div>
                <p className="mb-1 text-xs font-medium">Pitch</p>
                <p className="rounded-md bg-muted/50 p-2.5 text-xs">{inspectDeal.pitch}</p>
              </div>
              {inspectDeal.thesis && (
                <div>
                  <p className="mb-1 text-xs font-medium">Thesis</p>
                  <p className="rounded-md bg-muted/50 p-2.5 text-xs leading-relaxed">{inspectDeal.thesis}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-md border p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Target</p>
                  <p className="text-sm font-semibold">${(Number(inspectDeal.target_raise) || 0).toLocaleString()}</p>
                </div>
                <div className="rounded-md border p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Equity</p>
                  <p className="text-sm font-semibold">{inspectDeal.equity_pct}%</p>
                </div>
                <div className="rounded-md border p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">Royalty</p>
                  <p className="text-sm font-semibold">{inspectDeal.royalty_pct || 0}%</p>
                </div>
                <div className="rounded-md border p-2 text-center">
                  <p className="text-[10px] text-muted-foreground">AI score</p>
                  <p className="text-sm font-semibold">{inspectDeal.ai_score ? `${inspectDeal.ai_score}/100` : '88/100'}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between p-4 pt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!openThesisPdf(inspectDeal)) handleExpressInterest(inspectDeal.id)
                }}
              >
                <FileText className="size-3" />
                Open thesis PDF
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setInspectDeal(null)
                  handleNegotiateClick(inspectDeal)
                }}
              >
                Enter dealroom
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {showGatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-900">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Verification required</CardTitle>
                  <CardDescription className="text-xs">AI CV verification is required to negotiate.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-3 text-xs text-muted-foreground">
              Upload a PDF CV and obtain the <span className="font-medium text-foreground">AI{'\u00A0'}Verified</span> badge before entering a dealroom.
            </CardContent>
            <CardFooter className="justify-end gap-2 p-4 pt-0">
              <Button variant="outline" size="sm" onClick={() => setShowGatingModal(false)}>Cancel</Button>
              <Button
                size="sm"
                onClick={() => {
                  setShowGatingModal(false)
                  navigate('/investor/profile')
                }}
              >
                Upload CV
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
