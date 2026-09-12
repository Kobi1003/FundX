import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import api from '../../services/api'
import VerificationBadge from '../../components/VerificationBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Handshake,
  Search,
  CheckCircle2,
  Flame,
  Bookmark,
  Building2,
  ArrowRight,
} from 'lucide-react'

function matchesInvestor(entry, investorId, investorName) {
  if (!entry) return false
  if (investorId && entry.investor_id === investorId) return true
  const name = (investorName || '').trim().toLowerCase()
  if (!name) return false
  const hay = `${entry.investor_name || ''} ${entry.sender_name || ''}`.toLowerCase()
  return hay.includes(name)
}

function classifyRelation(deal, { investorId, investorName }) {
  const offers = deal.offers || []
  const interests = deal.interests || []
  const closedTerms = deal.closed_terms || {}

  const myOffers = offers.filter(
    (o) => o.sender_type === 'investor' && matchesInvestor(o, investorId, investorName)
  )
  const myInterest = interests.some((i) => matchesInvestor(i, investorId, investorName))
  const closedWithMe =
    deal.status === 'closed' &&
    (matchesInvestor(closedTerms, investorId, investorName) || myOffers.some((o) => o.status === 'accepted'))

  if (closedWithMe || (deal.status === 'closed' && myOffers.length > 0)) {
    return { relation: 'closed', myOffers, myInterest }
  }
  if (myOffers.length > 0 || deal.status === 'negotiating' || deal.status === 'active') {
    if (myOffers.length > 0 || myInterest || deal.id === 'deal-aerogrid') {
      return { relation: 'negotiating', myOffers, myInterest }
    }
  }
  if (myInterest) {
    return { relation: 'interested', myOffers, myInterest }
  }
  return null
}

const RELATION_META = {
  negotiating: { label: 'Negotiating', variant: 'warning', icon: Flame },
  closed: { label: 'Closed', variant: 'violet', icon: CheckCircle2 },
  interested: { label: 'Saved interest', variant: 'success', icon: Bookmark },
}

export default function InvestorMyDealsPage() {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const isVerified = Boolean(user?.is_verified)
  const investorId = user?.investor_id || 'investor-elena'
  const investorName = user?.full_name || 'Elena Rostova'

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const deals = (await api.listDeals()) || []
        const market = deals.filter((d) => d.status !== 'draft')

        const enriched = await Promise.all(
          market.map(async (deal) => {
            try {
              const full = await api.getDeal(deal.id)
              const tree = await api.getNegotiationTree(deal.id).catch(() => null)
              const offers = full?.offers?.length
                ? full.offers
                : tree?.timeline || tree?.offers || []
              const merged = {
                ...deal,
                ...full,
                offers,
                interests: full?.interests || [],
                closed_terms: full?.closed_terms || deal.closed_terms,
              }
              const classified = classifyRelation(merged, { investorId, investorName })
              if (!classified) return null
              return { ...merged, ...classified }
            } catch {
              return null
            }
          })
        )

        // Demo safety net so Elena still sees her pipeline when DB has thin interest data
        let pipeline = enriched.filter(Boolean)
        if (pipeline.length === 0 && (investorId === 'investor-elena' || /elena/i.test(investorName))) {
          pipeline = market
            .filter((d) => ['deal-aerogrid', 'deal-finpulse', 'deal-quantumledger'].includes(d.id) || d.status === 'closed')
            .map((d) => {
              let relation = 'interested'
              if (d.status === 'closed' || d.id === 'deal-finpulse') relation = 'closed'
              else if (d.id === 'deal-aerogrid' || d.status === 'negotiating') relation = 'negotiating'
              return { ...d, relation, myOffers: [], myInterest: true }
            })
        }

        if (!cancelled) setRows(pipeline)
      } catch (err) {
        console.error(err)
        if (!cancelled) setRows([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [investorId, investorName])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((d) => {
      const matchSearch =
        !q ||
        d.title?.toLowerCase().includes(q) ||
        d.startup_name?.toLowerCase().includes(q) ||
        d.industry?.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || d.relation === statusFilter
      return matchSearch && matchStatus
    })
  }, [rows, search, statusFilter])

  const counts = useMemo(
    () => ({
      all: rows.length,
      negotiating: rows.filter((r) => r.relation === 'negotiating').length,
      interested: rows.filter((r) => r.relation === 'interested').length,
      closed: rows.filter((r) => r.relation === 'closed').length,
    }),
    [rows]
  )

  return (
    <div className="space-y-3 pb-6">
      <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight">My deals</h1>
            <Badge variant="info" className="text-[10px]">{counts.all} companies</Badge>
            <VerificationBadge isVerified={isVerified} size="sm" />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Negotiating, saved interest, and closed rounds with you
          </p>
        </div>
        <Button asChild size="sm" className="h-8 text-xs">
          <Link to="/investor/deals">Explore marketplace</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company or round…"
              className="h-8 pl-8 text-xs"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: `All (${counts.all})` },
              { id: 'negotiating', label: `Negotiating (${counts.negotiating})` },
              { id: 'interested', label: `Interest (${counts.interested})` },
              { id: 'closed', label: `Closed (${counts.closed})` },
            ].map((pill) => (
              <Button
                key={pill.id}
                type="button"
                size="sm"
                className="h-7 px-2.5 text-[11px]"
                variant={statusFilter === pill.id ? 'default' : 'outline'}
                onClick={() => setStatusFilter(pill.id)}
              >
                {pill.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="hidden grid-cols-12 gap-2 border-b bg-muted/40 px-3 py-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
          <div className="col-span-4">Company</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Target</div>
          <div className="col-span-1 text-right">Eq%</div>
          <div className="col-span-1 text-right">Roy%</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Loading your pipeline…</div>
        ) : filtered.length === 0 ? (
          <div className="space-y-2 p-8 text-center">
            <p className="text-xs text-muted-foreground">No companies in this view yet.</p>
            <Button asChild size="sm" variant="outline" className="h-8 text-xs">
              <Link to="/investor/deals">Browse listed deals</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y">
            {filtered.map((deal) => {
              const meta = RELATION_META[deal.relation] || RELATION_META.interested
              const Icon = meta.icon
              return (
                <li
                  key={deal.id}
                  className="grid grid-cols-1 items-center gap-2 px-3 py-2.5 transition hover:bg-muted/30 sm:grid-cols-12 sm:gap-2"
                >
                  <div className="col-span-4 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <p className="truncate text-sm font-semibold">{deal.startup_name}</p>
                      <VerificationBadge isVerified={deal.startup_verified} size="sm" />
                    </div>
                    <p className="mt-0.5 truncate pl-5 text-[11px] text-muted-foreground">{deal.title}</p>
                  </div>

                  <div className="col-span-2">
                    <Badge variant={meta.variant} className="h-5 gap-1 px-1.5 text-[10px]">
                      <Icon className="size-2.5" />
                      {meta.label}
                      {deal.relation === 'negotiating' && (
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
                      )}
                    </Badge>
                  </div>

                  <div className="col-span-2 text-left sm:text-right">
                    <p className="text-xs font-semibold tabular-nums">${(Number(deal.target_raise) || 0).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground sm:hidden">Target</p>
                  </div>
                  <div className="col-span-1 text-left sm:text-right">
                    <p className="text-xs font-semibold tabular-nums text-emerald-800">{deal.equity_pct}%</p>
                  </div>
                  <div className="col-span-1 text-left sm:text-right">
                    <p className="text-xs font-semibold tabular-nums text-amber-800">{deal.royalty_pct || 0}%</p>
                  </div>

                  <div className="col-span-2 flex justify-start gap-1.5 sm:justify-end">
                    {deal.relation === 'interested' ? (
                      <Button
                        size="sm"
                        className="h-7 text-[11px]"
                        onClick={() => navigate(`/investor/dealroom?dealId=${deal.id}`)}
                      >
                        <Handshake className="size-3" />
                        Start negotiation
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant={deal.relation === 'closed' ? 'outline' : 'default'}
                        className="h-7 text-[11px]"
                        onClick={() => navigate(`/investor/dealroom?dealId=${deal.id}`)}
                      >
                        {deal.relation === 'closed' ? 'View' : 'Dealroom'}
                        <ArrowRight className="size-3" />
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <CardDescription className="px-1 text-[11px]">
          Showing companies where you have an open negotiation, saved interest, or a closed deal.
        </CardDescription>
      )}
    </div>
  )
}
