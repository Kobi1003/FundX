import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import VerificationBadge from '../../components/VerificationBadge'
import { BentoGrid, BentoItem } from '../../components/BentoGrid'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

export default function AdminDashboardPage() {
  const [startups, setStartups] = useState([])
  const [investors, setInvestors] = useState([])
  const [deals, setDeals] = useState([])
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      api.listStartups(),
      api.listInvestors(),
      api.listDeals(),
      api.health(),
    ]).then(([sRes, iRes, dRes, hRes]) => {
      if (sRes.status === 'fulfilled') setStartups(sRes.value || [])
      if (iRes.status === 'fulfilled') setInvestors(iRes.value || [])
      if (dRes.status === 'fulfilled') setDeals(dRes.value || [])
      if (hRes.status === 'fulfilled') setHealth(hRes.value || null)
      setLoading(false)
    })
  }, [])

  const verifiedStartups = startups.filter((s) => s.is_verified)
  const verifiedInvestors = investors.filter((i) => i.is_verified)
  const openDeals = deals.filter((d) => d.status === 'published' || d.status === 'negotiating')
  const closedDeals = deals.filter((d) => d.status === 'closed')
  const totalVolume = deals.reduce((acc, d) => acc + (Number(d.target_raise) || 0), 0)
  const startupPct = startups.length ? (verifiedStartups.length / startups.length) * 100 : 0
  const investorPct = investors.length ? (verifiedInvestors.length / investors.length) * 100 : 0

  return (
    <div className="space-y-4 pb-8">
      <BentoGrid>
        <BentoItem className="md:col-span-6 xl:col-span-8">
          <Card className="h-full">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <Badge variant="warning">Super admin</Badge>
                <CardTitle className="text-2xl">Platform governance</CardTitle>
                <CardDescription>
                  Supervise verification queues, marketplace liquidity, and service health.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link to="/admin/marketplace">Marketplace ({deals.length})</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/company-edit">Re-verify company</Link>
                </Button>
              </div>
            </CardHeader>
          </Card>
        </BentoItem>

        <BentoItem className="md:col-span-6 xl:col-span-4">
          <Card className="h-full tile-violet">
            <CardHeader>
              <CardTitle className="text-sm">Pipeline volume</CardTitle>
              <CardDescription>Target raise across the book.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums text-violet-800">${(totalVolume / 1000000).toFixed(2)}M</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Avg deal ${(totalVolume / (deals.length || 1) / 1000).toFixed(0)}k
              </p>
            </CardContent>
          </Card>
        </BentoItem>

        <BentoItem className="md:col-span-3 xl:col-span-3">
          <Card className="tile-emerald">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription>Startups</CardDescription>
                <Badge variant="success">{verifiedStartups.length} verified</Badge>
              </div>
              <CardTitle className="text-3xl tabular-nums text-emerald-800">{startups.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={startupPct} />
            </CardContent>
          </Card>
        </BentoItem>
        <BentoItem className="md:col-span-3 xl:col-span-3">
          <Card className="tile-sky">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription>Investors</CardDescription>
                <Badge variant="info">{verifiedInvestors.length} verified</Badge>
              </div>
              <CardTitle className="text-3xl tabular-nums text-sky-800">{investors.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={investorPct} />
            </CardContent>
          </Card>
        </BentoItem>
        <BentoItem className="md:col-span-3 xl:col-span-3">
          <Card className="tile-amber">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription>Deals</CardDescription>
                <Badge variant="warning">{openDeals.length} active</Badge>
              </div>
              <CardTitle className="text-3xl tabular-nums text-amber-800">{deals.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{closedDeals.length} closed</p>
            </CardContent>
          </Card>
        </BentoItem>
        <BentoItem className="md:col-span-3 xl:col-span-3">
          <Card className="tile-violet">
            <CardHeader>
              <CardDescription>Drafts</CardDescription>
              <CardTitle className="text-3xl tabular-nums text-violet-800">
                {deals.filter((d) => d.status === 'draft').length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Not yet listed</p>
            </CardContent>
          </Card>
        </BentoItem>

        <BentoItem className="md:col-span-6 xl:col-span-8">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Startup queue</CardTitle>
                <CardDescription>Recent entities and background status.</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/admin/startups">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {startups.slice(0, 5).map((s, index) => (
                <div key={s.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{s.name}</p>
                        <VerificationBadge isVerified={s.is_verified} status={s.verification_status} size="sm" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {s.industry} · {s.stage || 'Seed'} · GST {s.gst_number || 'missing'}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/admin/company-edit?id=${s.id}`}>Edit</Link>
                    </Button>
                  </div>
                  {index < Math.min(startups.length, 5) - 1 && <Separator className="mt-3" />}
                </div>
              ))}
              {!loading && startups.length === 0 && (
                <p className="text-sm text-muted-foreground">No startups loaded.</p>
              )}
            </CardContent>
          </Card>
        </BentoItem>

        <BentoItem className="md:col-span-6 xl:col-span-4">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Investors</CardTitle>
                <CardDescription>Accreditation and CV status.</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/admin/investors">View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {investors.map((inv, index) => (
                <div key={inv.id}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{inv.display_name}</p>
                      <p className="text-xs text-muted-foreground">{inv.firm || 'Independent'}</p>
                    </div>
                    <VerificationBadge isVerified={inv.is_verified} size="sm" />
                  </div>
                  {index < investors.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </BentoItem>

        <BentoItem className="md:col-span-6 xl:col-span-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Active deals</CardTitle>
                <CardDescription>Live marketplace and dealrooms.</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link to="/admin/marketplace">Supervise</Link>
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {deals.slice(0, 4).map((d) => (
                <div key={d.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{d.funding_stage || 'Seed'}</span>
                    <Badge variant="secondary">{d.status}</Badge>
                  </div>
                  <p className="mt-2 line-clamp-1 font-medium">{d.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.pitch}</p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="font-semibold">${(Number(d.target_raise) || 0).toLocaleString()}</span>
                    <span className="text-muted-foreground">{d.equity_pct}% eq · {d.royalty_pct || 0}% roy</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </BentoItem>

        <BentoItem className="md:col-span-6 xl:col-span-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Service mesh</CardTitle>
              <CardDescription>Gateway downstream probes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {health?.downstream ? (
                Object.entries(health.downstream).map(([name, svc]) => (
                  <div key={name} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <span className="font-mono text-xs">{name}</span>
                    <Badge variant={svc.status === 'ok' ? 'default' : 'destructive'}>
                      {svc.status.toUpperCase()}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Loading downstream status…</p>
              )}
            </CardContent>
          </Card>
        </BentoItem>
      </BentoGrid>
    </div>
  )
}
