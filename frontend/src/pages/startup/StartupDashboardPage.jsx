import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import api from '../../services/api'
import VerificationBadge from '../../components/VerificationBadge'
import DarkVeilCard from '../../components/DarkVeilCard'
import { BentoGrid, BentoItem } from '../../components/BentoGrid'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ShieldAlert, Plus, Handshake } from 'lucide-react'

export default function StartupDashboardPage() {
  const { user } = useAuthContext()
  const [startup, setStartup] = useState(null)
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)

  const startupId = user?.startup_id || 'startup-aerogrid'

  useEffect(() => {
    Promise.allSettled([api.getStartup(startupId), api.listDeals()]).then(
      ([sRes, dRes]) => {
        if (sRes.status === 'fulfilled') setStartup(sRes.value)
        if (dRes.status === 'fulfilled') {
          const allDeals = dRes.value || []
          setDeals(allDeals.filter((d) => d.startup_id === startupId))
        }
        setLoading(false)
      }
    )
  }, [startupId])

  const publishedDeals = deals.filter((d) => d.status === 'published' || d.status === 'negotiating')
  const closedDeals = deals.filter((d) => d.status === 'closed')
  const draftDeals = deals.filter((d) => d.status === 'draft')
  const negotiating = deals.filter((d) => d.status === 'negotiating').length
  const isVerified = Boolean(startup?.is_verified || user?.is_verified)
  const score = startup?.verification_score || (isVerified ? 94 : 60)

  return (
    <div className="space-y-4 pb-8">
      <DarkVeilCard
        title={startup?.name ? `${startup.name} · Founder Command Center` : 'Founder Command Center'}
        subtitle="Manage equity raises, royalty terms, investor term sheets, and verification standing with Dark Veil AI analytics."
        defaultHue={150}
        defaultSpeed={0.5}
        defaultWarp={0.3}
      />

      <BentoGrid>
        <BentoItem className="md:col-span-6 xl:col-span-8">
          <Card className="h-full">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="success">Founder desk</Badge>
                  <VerificationBadge isVerified={isVerified} size="md" />
                </div>
                <CardTitle className="text-2xl">
                  {startup?.name || user?.startup_name || 'Founder dashboard'}
                </CardTitle>
                <CardDescription>
                  {startup?.tagline ||
                    'Manage raises, investor offers, and company verification from one place.'}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link to="/startup/deals/create">
                    <Plus />
                    Create deal
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/startup/dealroom">Dealroom ({publishedDeals.length + closedDeals.length})</Link>
                </Button>
              </div>
            </CardHeader>
          </Card>
        </BentoItem>

        <BentoItem className="md:col-span-6 xl:col-span-4">
          <Card className="h-full tile-emerald">
            <CardHeader>
              <CardTitle className="text-sm">Background score</CardTitle>
              <CardDescription>GST and incorporation standing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-semibold tabular-nums text-emerald-800">{score}/100</p>
              <Progress value={score} />
              <VerificationBadge isVerified={isVerified} size="sm" />
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
                    <p className="font-semibold text-amber-950">Company verification recommended</p>
                    <p className="text-sm text-amber-800">
                      Run the AI verifier so listed deals show a trust badge.
                    </p>
                  </div>
                </div>
                <Button asChild>
                  <Link to="/startup/verifier">Verify company</Link>
                </Button>
              </CardContent>
            </Card>
          </BentoItem>
        )}

        <BentoItem className="md:col-span-2 xl:col-span-3">
          <Card className="tile-emerald">
            <CardHeader>
              <CardDescription>Published</CardDescription>
              <CardTitle className="text-3xl tabular-nums text-emerald-800">{publishedDeals.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{draftDeals.length} draft in progress</p>
            </CardContent>
          </Card>
        </BentoItem>
        <BentoItem className="md:col-span-2 xl:col-span-3">
          <Card className="tile-amber">
            <CardHeader>
              <CardDescription>Negotiations</CardDescription>
              <CardTitle className="text-3xl tabular-nums text-amber-800">{negotiating}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Investor offers received</p>
            </CardContent>
          </Card>
        </BentoItem>
        <BentoItem className="md:col-span-2 xl:col-span-3">
          <Card className="tile-violet">
            <CardHeader>
              <CardDescription>Closed</CardDescription>
              <CardTitle className="text-3xl tabular-nums text-violet-800">{closedDeals.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Executed term sheets</p>
            </CardContent>
          </Card>
        </BentoItem>
        <BentoItem className="md:col-span-6 xl:col-span-3">
          <Card className="tile-sky">
            <CardHeader>
              <CardDescription>Live rooms</CardDescription>
              <CardTitle className="text-3xl tabular-nums text-sky-800">{publishedDeals.length + closedDeals.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link to="/startup/dealroom">Open dealroom</Link>
              </Button>
            </CardContent>
          </Card>
        </BentoItem>

        <BentoItem className="md:col-span-6 xl:col-span-12">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Company deals</CardTitle>
                <CardDescription>Drafts, listed rounds, and negotiations.</CardDescription>
              </div>
              <Button asChild size="sm">
                <Link to="/startup/deals/create">New deal</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {deals.map((deal) => (
                  <div key={deal.id} className="flex flex-col justify-between rounded-lg border p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{deal.funding_stage || 'Seed'}</span>
                        <Badge variant="secondary">{deal.status}</Badge>
                      </div>
                      <p className="font-semibold">{deal.title}</p>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{deal.pitch}</p>
                      <div className="grid grid-cols-3 gap-2 rounded-md bg-muted/50 p-3 text-center">
                        <div>
                          <p className="text-[11px] text-muted-foreground">Raise</p>
                          <p className="text-sm font-semibold">${(Number(deal.target_raise) || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">Equity</p>
                          <p className="text-sm font-semibold">{deal.equity_pct}%</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-muted-foreground">Royalty</p>
                          <p className="text-sm font-semibold">{deal.royalty_pct || 0}%</p>
                        </div>
                      </div>
                    </div>
                    <Button asChild className="mt-4" size="sm">
                      <Link to="/startup/dealroom">
                        <Handshake />
                        Manage in dealroom
                      </Link>
                    </Button>
                  </div>
                ))}
                {deals.length === 0 && !loading && (
                  <div className="col-span-full rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                    No deals yet.{' '}
                    <Link to="/startup/deals/create" className="font-medium text-foreground underline">
                      Create the first raise
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </BentoItem>
      </BentoGrid>
    </div>
  )
}
