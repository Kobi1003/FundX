import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import api from '../../services/api'
import VerificationBadge from '../../components/VerificationBadge'
import { BentoGrid, BentoItem } from '../../components/BentoGrid'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Handshake,
  Search,
  Filter,
  Circle,
  CheckCircle2,
  Flame,
  ArrowRight,
} from 'lucide-react'

const recentDealsFromOtherInvestors = [
  { id: 'recent-1', investor_name: 'Vikram Mehta', firm: 'Nexus Angel Syndicate', startup_name: 'AeroGrid Tech', deal_title: 'Autonomous Renewable Microgrid', amount: 800000, equity_pct: 7.5, royalty_pct: 2.2, status: 'Negotiating', time: '2 hours ago' },
  { id: 'recent-2', investor_name: 'Elena Rostova', firm: 'Apex Horizon Capital', startup_name: 'FinPulse AI', deal_title: 'B2B Treasury & FX Settlement', amount: 1500000, equity_pct: 8.5, royalty_pct: 1.5, status: 'Executed', time: 'Yesterday' },
  { id: 'recent-3', investor_name: 'David Miller', firm: 'Private Angel Syndicate', startup_name: 'BioSynthetix Labs', deal_title: 'Protein Design for Oncology', amount: 400000, equity_pct: 6.0, royalty_pct: 3.0, status: 'Interest', time: '1 day ago' },
  { id: 'recent-4', investor_name: 'Alex Mercer', firm: 'DeepTech Angel Group', startup_name: 'QuantumLedger AI', deal_title: 'Post-Quantum Audit Engine', amount: 1200000, equity_pct: 9.0, royalty_pct: 2.0, status: 'Review', time: '2 days ago' },
  { id: 'recent-5', investor_name: 'Dr. Sarah Chen', firm: 'BioVentures Capital', startup_name: 'BioSynthetix Labs', deal_title: 'Oncology Pipeline', amount: 500000, equity_pct: 7.0, royalty_pct: 2.5, status: 'Pre-term', time: '3 days ago' },
]

export default function InvestorMyDealsPage() {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const isVerified = Boolean(user?.is_verified)

  useEffect(() => {
    api
      .listDeals()
      .then((data) => {
        const ongoing = (data || []).filter((d) => d.status !== 'draft')
        setDeals(ongoing)
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const filteredDeals = deals.filter((d) => {
    const matchSearch =
      d.title?.toLowerCase().includes(search.toLowerCase()) ||
      d.startup_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.pitch?.toLowerCase().includes(search.toLowerCase())

    const isNegotiating = d.status === 'negotiating' || d.status === 'active'
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'negotiating' && isNegotiating) ||
      (statusFilter === 'open' && d.status === 'published') ||
      (statusFilter === 'closed' && d.status === 'closed')

    return matchSearch && matchStatus
  })

  return (
    <div className="space-y-4 pb-8">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">My deals</h1>
              <Badge variant="info">{filteredDeals.length} rounds</Badge>
              <VerificationBadge isVerified={isVerified} size="md" />
            </div>
            <CardDescription>
              Active pipeline on the left, live syndicate tape on the right.
            </CardDescription>
          </div>
          <Button asChild size="sm">
            <Link to="/investor/deals">Explore marketplace</Link>
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by startup, keywords, or pitch…"
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All statuses</option>
              <option value="negotiating">In negotiation</option>
              <option value="open">Open round</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <BentoGrid>
        <BentoItem className="md:col-span-6 xl:col-span-7">
          <div className="space-y-3">
            <p className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Pipeline ({filteredDeals.length})
            </p>
            {loading ? (
              <Card>
                <CardContent className="p-10 text-center text-sm text-muted-foreground">Loading deals…</CardContent>
              </Card>
            ) : filteredDeals.length === 0 ? (
              <Card>
                <CardContent className="p-10 text-center text-sm text-muted-foreground">
                  No deals match the current search.
                </CardContent>
              </Card>
            ) : (
              filteredDeals.map((deal) => {
                const isNegotiating = deal.status === 'negotiating' || deal.status === 'active' || deal.id === 'deal-aerogrid'
                const isClosed = deal.status === 'closed'
                return (
                  <Card key={deal.id}>
                    <CardHeader className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-base">{deal.startup_name}</CardTitle>
                          <VerificationBadge isVerified={deal.startup_verified} size="sm" />
                        </div>
                        <Badge variant={isClosed ? 'violet' : isNegotiating ? 'warning' : 'success'} className="flex-nowrap">
                          {isClosed ? <CheckCircle2 className="size-3" /> : isNegotiating ? <Flame className="size-3" /> : <Circle className="size-2 fill-current" />}
                          {isClosed ? 'Closed' : isNegotiating ? 'Negotiating' : 'Open'}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{deal.title}</p>
                      <CardDescription className="line-clamp-2">{deal.pitch}</CardDescription>
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
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          AI score {deal.ai_score ? `${deal.ai_score}/100` : '88/100'}
                        </span>
                        <Button size="sm" onClick={() => navigate(`/investor/dealroom?dealId=${deal.id}`)}>
                          <Handshake />
                          Open dealroom
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </BentoItem>

        <BentoItem className="md:col-span-6 xl:col-span-5">
          <Card className="sticky top-20">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Syndicate tape</CardTitle>
                <Badge variant="success">Live</Badge>
              </div>
              <CardDescription>Recent offers from other investors.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentDealsFromOtherInvestors.map((item, index) => (
                <div key={item.id}>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.investor_name}</span>
                      <span className="text-xs text-muted-foreground">{item.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{item.startup_name}</span> · {item.firm}
                    </p>
                    <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
                      <span className="font-semibold tabular-nums">${item.amount.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">{item.equity_pct}% eq · {item.royalty_pct}% roy</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">{item.status}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/investor/deals')}>
                        View <ArrowRight />
                      </Button>
                    </div>
                  </div>
                  {index < recentDealsFromOtherInvestors.length - 1 && <Separator className="mt-3" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </BentoItem>
      </BentoGrid>
    </div>
  )
}
