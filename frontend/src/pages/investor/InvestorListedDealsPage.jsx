import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import api from '../../services/api'
import VerificationBadge from '../../components/VerificationBadge'
import { BentoGrid, BentoItem } from '../../components/BentoGrid'
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
} from 'lucide-react'

function getDealInterestConfig(deal) {
  const status = deal.status || 'published'

  if (status === 'negotiating' || deal.id === 'deal-aerogrid' || (deal.interested_count && deal.interested_count >= 5)) {
    return {
      type: 'HOT',
      label: 'High interest',
      icon: Flame,
      badge: 'warning',
    }
  }

  if (deal.id === 'deal-finpulse' || deal.id === 'deal-quantumledger' || (deal.interested_count && deal.interested_count >= 2)) {
    return {
      type: 'MODERATE',
      label: 'Active interest',
      icon: Zap,
      badge: 'info',
    }
  }

  return {
    type: 'NEW',
    label: 'Newly listed',
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
    <div className="space-y-4 pb-8">
      <BentoGrid>
        <BentoItem className="md:col-span-6 xl:col-span-8">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight">Listed deals</h1>
                  <VerificationBadge isVerified={isVerified} size="md" />
                </div>
                <CardDescription>
                  Filter verified raises by activity, stage, and sector, then open a dealroom.
                </CardDescription>
              </div>
              {!isVerified && (
                <Button asChild size="sm">
                  <Link to="/investor/profile">Verify CV to negotiate</Link>
                </Button>
              )}
            </CardHeader>
          </Card>
        </BentoItem>
        <BentoItem className="md:col-span-6 xl:col-span-4">
          <Card className="h-full">
            <CardContent className="grid grid-cols-3 gap-3 p-5">
              <div className="tile-emerald rounded-lg border p-3">
                <p className="text-2xl font-semibold tabular-nums text-emerald-800">{deals.length}</p>
                <p className="text-xs text-muted-foreground">Live rounds</p>
              </div>
              <div className="tile-amber rounded-lg border p-3">
                <p className="text-2xl font-semibold tabular-nums text-amber-800">{hotCount}</p>
                <p className="text-xs text-muted-foreground">High interest</p>
              </div>
              <div className="tile-sky rounded-lg border p-3">
                <p className="text-2xl font-semibold tabular-nums text-sky-800">{newCount}</p>
                <p className="text-xs text-muted-foreground">New listings</p>
              </div>
            </CardContent>
          </Card>
        </BentoItem>
      </BentoGrid>

      {alert && (
        <Card className={alert.type === 'success' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="flex items-center justify-between gap-3 p-4 text-sm">
            <span>{alert.text}</span>
            <Button variant="ghost" size="sm" onClick={() => setAlert(null)}>Dismiss</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by technology, pitch, or startup…"
                className="pl-9"
              />
            </div>
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {industries.map((ind) => (
                <option key={ind} value={ind}>{ind === 'all' ? 'All industries' : ind}</option>
              ))}
            </select>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              {stages.map((stg) => (
                <option key={stg} value={stg}>{stg === 'all' ? 'All stages' : stg}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: `All (${deals.length})` },
              { id: 'hot', label: `High interest (${hotCount})` },
              { id: 'moderate', label: `Active (${moderateCount})` },
              { id: 'new', label: `New (${newCount})` },
            ].map((pill) => (
              <Button
                key={pill.id}
                type="button"
                size="sm"
                variant={interestFilter === pill.id ? 'default' : 'outline'}
                onClick={() => setInterestFilter(pill.id)}
              >
                {pill.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((deal) => {
          const config = getDealInterestConfig(deal)
          const Icon = config.icon
          return (
            <Card key={deal.id} className="flex flex-col">
              <CardHeader className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={config.badge} className="flex-nowrap">
                    <Icon className="size-3" />
                    {config.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{deal.funding_stage || 'Seed'}</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="flex items-center gap-1.5 text-base">
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {deal.startup_name}
                    </CardTitle>
                    <VerificationBadge isVerified={deal.startup_verified} size="sm" />
                  </div>
                  <p className="mt-1.5 text-sm font-medium leading-snug">{deal.title}</p>
                  <CardDescription className="mt-1 line-clamp-2">{deal.pitch}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2 rounded-md bg-muted/50 p-3 text-center">
                  <div>
                    <p className="text-[11px] text-muted-foreground">Target</p>
                    <p className="text-sm font-semibold">${(Number(deal.target_raise) || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Equity</p>
                    <p className="text-sm font-semibold text-emerald-800">{deal.equity_pct}%</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground">Royalty</p>
                    <p className="text-sm font-semibold text-amber-800">{deal.royalty_pct || 0}%</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">AI feasibility</span>
                  <span className="font-medium">{deal.ai_score ? `${deal.ai_score}/100` : '88/100'}</span>
                </div>
              </CardContent>
              <CardFooter className="mt-auto gap-2">
                <Button variant="outline" size="sm" onClick={() => setInspectDeal(deal)}>
                  Thesis
                </Button>
                <Button size="sm" className="flex-1" onClick={() => handleNegotiateClick(deal)}>
                  <Handshake />
                  {isVerified ? 'Enter dealroom' : 'Verify to negotiate'}
                </Button>
              </CardFooter>
            </Card>
          )
        })}

        {(loading || filtered.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="p-12 text-center text-sm text-muted-foreground">
              {loading
                ? 'Loading marketplace rounds…'
                : 'No deals match the current filters.'}
            </CardContent>
          </Card>
        )}
      </div>

      {inspectDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardDescription>{inspectDeal.funding_stage} · {inspectDeal.industry}</CardDescription>
                <CardTitle className="mt-1">{inspectDeal.title}</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setInspectDeal(null)}>Close</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-1 text-sm font-medium">Pitch</p>
                <p className="rounded-md bg-muted/50 p-3 text-sm">{inspectDeal.pitch}</p>
              </div>
              {inspectDeal.thesis && (
                <div>
                  <p className="mb-1 text-sm font-medium">Thesis</p>
                  <p className="rounded-md bg-muted/50 p-3 text-sm leading-relaxed">{inspectDeal.thesis}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-md border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Target</p>
                  <p className="font-semibold">${(Number(inspectDeal.target_raise) || 0).toLocaleString()}</p>
                </div>
                <div className="rounded-md border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Equity</p>
                  <p className="font-semibold">{inspectDeal.equity_pct}%</p>
                </div>
                <div className="rounded-md border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Royalty</p>
                  <p className="font-semibold">{inspectDeal.royalty_pct || 0}%</p>
                </div>
                <div className="rounded-md border p-3 text-center">
                  <p className="text-xs text-muted-foreground">AI score</p>
                  <p className="font-semibold">{inspectDeal.ai_score ? `${inspectDeal.ai_score}/100` : '88/100'}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={() => handleExpressInterest(inspectDeal.id)}>
                Express interest
              </Button>
              <Button
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
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-900">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Verification required</CardTitle>
                  <CardDescription>AI CV verification is required to negotiate.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Upload a PDF CV and obtain the <span className="font-medium text-foreground">AI{'\u00A0'}Verified</span> badge before entering a dealroom.
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button variant="outline" onClick={() => setShowGatingModal(false)}>Cancel</Button>
              <Button
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
