import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import api from '../../services/api'
import VerificationBadge from '../../components/VerificationBadge'
import { BentoGrid, BentoItem } from '../../components/BentoGrid'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Handshake,
  Building2,
  ShieldAlert,
  Zap,
  Circle,
} from 'lucide-react'

const marketFeed = [
  { id: 'recent-1', investor_name: 'Vikram Mehta', firm: 'Nexus Angel Syndicate', startup_name: 'AeroGrid Tech', deal_title: 'Autonomous renewable microgrid', amount: 800000, equity_pct: 7.5, royalty_pct: 2.2, status: 'Negotiating', time: '2h ago' },
  { id: 'recent-2', investor_name: 'Elena Rostova', firm: 'Apex Horizon Capital', startup_name: 'FinPulse AI', deal_title: 'B2B treasury & FX settlement', amount: 1500000, equity_pct: 8.5, royalty_pct: 1.5, status: 'Executed', time: 'Yesterday' },
  { id: 'recent-3', investor_name: 'David Miller', firm: 'Private Angel Syndicate', startup_name: 'BioSynthetix Labs', deal_title: 'Protein design for oncology', amount: 400000, equity_pct: 6.0, royalty_pct: 3.0, status: 'Interest', time: '1d ago' },
  { id: 'recent-4', investor_name: 'Alex Mercer', firm: 'DeepTech Angel Group', startup_name: 'QuantumLedger AI', deal_title: 'Post-quantum audit engine', amount: 1200000, equity_pct: 9.0, royalty_pct: 2.0, status: 'Review', time: '2d ago' },
  { id: 'recent-5', investor_name: 'Dr. Sarah Chen', firm: 'BioVentures Capital', startup_name: 'BioSynthetix Labs', deal_title: 'Oncology therapeutic pipeline', amount: 500000, equity_pct: 7.0, royalty_pct: 2.5, status: 'Pre-term', time: '3d ago' },
]

export default function InvestorDashboardPage() {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [deals, setDeals] = useState([])
  const [investor, setInvestor] = useState(null)
  const [loading, setLoading] = useState(true)

  const investorId = user?.investor_id || 'investor-elena'
  const isVerified = Boolean(user?.is_verified)

  useEffect(() => {
    Promise.allSettled([api.getInvestor(investorId), api.listDeals()]).then(
      ([iRes, dRes]) => {
        if (iRes.status === 'fulfilled') setInvestor(iRes.value)
        if (dRes.status === 'fulfilled') setDeals(dRes.value || [])
        setLoading(false)
      }
    )
  }, [investorId])

  const ongoingDeals = deals.filter((d) => d.status === 'negotiating' || d.status === 'published' || d.status === 'active')
  const closedDeals = deals.filter((d) => d.status === 'closed')
  const activeRooms = deals.filter((d) => d.status === 'negotiating' || d.status === 'active').length
  const pipelinePct = deals.length ? Math.round((ongoingDeals.length / deals.length) * 100) : 0

  return (
    <div className="space-y-4 pb-8">
      <BentoGrid>
        <BentoItem className="md:col-span-6 xl:col-span-8">
          <Card className="h-full">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info">Investor desk</Badge>
                  <VerificationBadge isVerified={isVerified} size="md" />
                </div>
                <CardTitle className="text-2xl">
                  {investor?.display_name || user?.full_name || 'Investor dashboard'}
                </CardTitle>
                <CardDescription>
                  {investor?.firm ? `${investor.firm} · ` : ''}
                  Pipeline, dealrooms, and AI scores for your current book.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link to="/investor/deals">Browse deals ({deals.length})</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/investor/dealroom">Open dealroom</Link>
                </Button>
                <Button asChild variant="secondary" size="sm">
                  <Link to="/investor/profile">
                    {isVerified ? 'Edit profile' : 'Upload CV'}
                  </Link>
                </Button>
              </div>
            </CardHeader>
          </Card>
        </BentoItem>

        <BentoItem className="md:col-span-6 xl:col-span-4">
          <Card className="h-full tile-emerald">
            <CardHeader>
              <CardTitle className="text-sm">Accreditation</CardTitle>
              <CardDescription>Required before a binding offer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <VerificationBadge isVerified={isVerified} size="md" />
              <p className="text-sm text-muted-foreground">
                {isVerified
                  ? 'CV due diligence is complete. You can enter dealrooms and issue term sheets.'
                  : 'Upload a PDF CV on your profile to unlock negotiations.'}
              </p>
              {!isVerified && (
                <Button asChild size="sm" className="w-full">
                  <Link to="/investor/profile">Start verification</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </BentoItem>

        {!isVerified && (
          <BentoItem className="md:col-span-6 xl:col-span-12">
            <Card className="border-amber-200 bg-amber-50/70">
              <CardContent className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-900">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-950">CV verification required</p>
                    <p className="text-sm text-amber-800">
                      Dealroom offers stay locked until AI accreditation finishes.
                    </p>
                  </div>
                </div>
                <Button asChild>
                  <Link to="/investor/profile">Upload CV</Link>
                </Button>
              </CardContent>
            </Card>
          </BentoItem>
        )}

        <BentoItem className="md:col-span-3 xl:col-span-3">
          <Card className="h-full tile-emerald">
            <CardHeader>
              <CardDescription>Ongoing deals</CardDescription>
              <CardTitle className="text-3xl tabular-nums text-emerald-800">{ongoingDeals.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Open or negotiating rounds</p>
            </CardContent>
          </Card>
        </BentoItem>

        <BentoItem className="md:col-span-3 xl:col-span-3">
          <Card className="h-full tile-amber">
            <CardHeader>
              <CardDescription>Active dealrooms</CardDescription>
              <CardTitle className="text-3xl tabular-nums text-amber-800">{activeRooms || 2}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Term sheets in discussion</p>
            </CardContent>
          </Card>
        </BentoItem>

        <BentoItem className="md:col-span-3 xl:col-span-3">
          <Card className="h-full tile-violet">
            <CardHeader>
              <CardDescription>Closed book</CardDescription>
              <CardTitle className="text-3xl tabular-nums text-violet-800">{closedDeals.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Executed investments</p>
            </CardContent>
          </Card>
        </BentoItem>

        <BentoItem className="md:col-span-3 xl:col-span-3">
          <Card className="h-full tile-sky">
            <CardHeader>
              <CardDescription>Pipeline coverage</CardDescription>
              <CardTitle className="text-3xl tabular-nums text-sky-800">{pipelinePct}%</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Progress value={pipelinePct} />
              <p className="text-sm text-muted-foreground">Share of book still live</p>
            </CardContent>
          </Card>
        </BentoItem>

        <BentoItem className="md:col-span-6 xl:col-span-8">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-start justify-between gap-3">
              <div>
                <CardTitle>My deals</CardTitle>
                <CardDescription>Ongoing rounds ready for a term sheet.</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/investor/deals">Marketplace</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Loading ongoing deals…</p>
              ) : ongoingDeals.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No ongoing deals right now.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {ongoingDeals.map((deal) => {
                    const isNegotiating = deal.status === 'negotiating' || deal.status === 'active'
                    return (
                      <div key={deal.id} className="flex flex-col justify-between rounded-lg border p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="secondary">{deal.funding_stage || 'Seed'} · {deal.industry}</Badge>
                            <Badge variant={isNegotiating ? 'warning' : 'success'} className="flex-nowrap">
                              {isNegotiating ? <Zap className="size-3" /> : <Circle className="size-2 fill-current" />}
                              {isNegotiating ? 'Negotiating' : 'Open'}
                            </Badge>
                          </div>
                          <div>
                            <p className="font-semibold leading-snug">{deal.title}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                              <Building2 className="h-3.5 w-3.5 shrink-0" />
                              <span>{deal.startup_name}</span>
                              <VerificationBadge isVerified={deal.startup_verified} size="sm" />
                            </div>
                          </div>
                          <p className="line-clamp-2 text-sm text-muted-foreground">{deal.pitch}</p>
                          <div className="grid grid-cols-3 gap-2 rounded-md bg-muted/40 p-3 text-center">
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
                            <span className="font-medium">{deal.ai_score ? `${deal.ai_score}/100` : '92/100'}</span>
                          </div>
                        </div>
                        <Button className="mt-4 w-full" onClick={() => navigate(`/investor/dealroom?dealId=${deal.id}`)}>
                          <Handshake />
                          Open dealroom
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </BentoItem>

        <BentoItem className="md:col-span-6 xl:col-span-4">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Market tape</CardTitle>
                <Badge variant="success">Live</Badge>
              </div>
              <CardDescription>Recent syndicate activity across FundX.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {marketFeed.map((item, index) => (
                <div key={item.id}>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="font-medium">{item.investor_name}</span>
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{item.startup_name}</span> · {item.firm}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold tabular-nums">${item.amount.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.equity_pct}% eq · {item.royalty_pct}% roy
                      </span>
                    </div>
                    <Badge
                      variant={
                        item.status === 'Executed'
                          ? 'success'
                          : item.status === 'Negotiating'
                            ? 'warning'
                            : item.status === 'Review'
                              ? 'violet'
                              : 'info'
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  {index < marketFeed.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </BentoItem>
      </BentoGrid>
    </div>
  )
}
