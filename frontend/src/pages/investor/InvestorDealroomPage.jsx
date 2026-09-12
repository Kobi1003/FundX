import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import api from '../../services/api'
import VerificationBadge from '../../components/VerificationBadge'
import NegotiationArenaTree from '../../components/NegotiationArenaTree'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Handshake,
  Search,
  ShieldAlert,
  Activity,
  Users,
} from 'lucide-react'

function relativeTime(ts) {
  if (!ts) return 'just now'
  const t = new Date(ts).getTime()
  if (Number.isNaN(t)) return String(ts)
  const diff = Date.now() - t
  const mins = Math.max(1, Math.floor(diff / 60000))
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 48) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function matchesInvestor(step, investorId, investorName) {
  if (!step) return false
  if (investorId && step.investor_id === investorId) return true
  const name = (investorName || '').trim().toLowerCase()
  if (!name) return false
  return `${step.investor_name || ''} ${step.sender_name || ''}`.toLowerCase().includes(name)
}

/** Company ↔ this investor only (exclude other investors' bids). */
function bilateralTimeline(timeline, investorId, investorName) {
  return (timeline || []).filter((step) => {
    if (step.sender_type === 'startup' || step.sender_type === 'founder') return true
    if (step.sender_type === 'investor') return matchesInvestor(step, investorId, investorName)
    return true
  })
}

function fallbackBilateralTimeline(deal, investorName = 'Elena Rostova') {
  return [
    {
      id: 'offer-1',
      investor_id: deal.startup_id || 'startup',
      investor_name: deal.startup_name || 'Founder',
      sender_type: 'startup',
      amount: deal.target_raise || 750000,
      equity_pct: deal.equity_pct || 7.0,
      royalty_pct: deal.royalty_pct || 2.5,
      royalty_payout_terms: deal.royalty_payout_terms || '2.5% quarterly revenue cap 2.0x',
      status: 'countered',
      message: 'Published initial marketplace term sheet.',
      timestamp: '2026-08-21T10:00:00Z',
    },
    {
      id: 'offer-2',
      investor_id: 'investor-elena',
      investor_name: investorName,
      sender_type: 'investor',
      amount: deal.target_raise || 750000,
      equity_pct: (deal.equity_pct || 7.0) - 0.5,
      royalty_pct: (deal.royalty_pct || 2.5) - 0.5,
      royalty_payout_terms: '2.0% quarterly revenue cap 1.8x',
      status: 'countered',
      message: 'Your counter-offer based on AI simulation.',
      timestamp: '2026-08-23T14:20:00Z',
    },
    {
      id: 'offer-3',
      investor_id: deal.startup_id || 'startup',
      investor_name: deal.startup_name || 'Founder',
      sender_type: 'startup',
      amount: deal.target_raise || 750000,
      equity_pct: (deal.equity_pct || 7.0) - 0.2,
      royalty_pct: (deal.royalty_pct || 2.5) - 0.3,
      royalty_payout_terms: '2.2% quarterly revenue cap 2.0x',
      status: 'active',
      message: 'Founder counter ready for your decision.',
      timestamp: '2026-08-25T09:15:00Z',
    },
  ]
}

function fallbackPeerOffers(deal) {
  return [
    {
      id: 'peer-1',
      investor_name: 'Vikram Mehta (Nexus Angel Syndicate)',
      sender_type: 'investor',
      amount: Math.round((deal.target_raise || 750000) * 0.9),
      equity_pct: (deal.equity_pct || 7.0) - 0.3,
      royalty_pct: (deal.royalty_pct || 2.5) - 0.2,
      status: 'countered',
      timestamp: '2026-08-22T11:00:00Z',
    },
    {
      id: 'peer-2',
      investor_name: 'David Miller (Private Angel)',
      sender_type: 'investor',
      amount: Math.round((deal.target_raise || 750000) * 0.55),
      equity_pct: (deal.equity_pct || 7.0) - 1.2,
      royalty_pct: (deal.royalty_pct || 2.5) + 0.3,
      status: 'countered',
      timestamp: '2026-08-24T16:40:00Z',
    },
  ]
}

export default function InvestorDealroomPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuthContext()

  const targetDealId = searchParams.get('dealId')

  const [deals, setDeals] = useState([])
  const [companySearch, setCompanySearch] = useState('')
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [treeData, setTreeData] = useState(null)
  const [fullTimeline, setFullTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const [showGatingModal, setShowGatingModal] = useState(false)
  const [offerModal, setOfferModal] = useState(false)
  const [offerTerms, setOfferTerms] = useState({
    amount: '',
    equity_pct: '',
    royalty_pct: '',
    royalty_payout_terms: '',
    message: '',
  })
  const [clock, setClock] = useState(() => Date.now())

  const isVerified = Boolean(user?.is_verified)
  const myId = user?.investor_id || 'investor-elena'
  const myName = user?.full_name || 'Elena Rostova'

  useEffect(() => {
    const id = setInterval(() => setClock(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])

  const loadDeals = async () => {
    setLoading(true)
    try {
      const allDeals = await api.listDeals()
      const roomDeals = (allDeals || []).filter((d) => d.status !== 'draft')
      setDeals(roomDeals)

      const matchedDeal = targetDealId ? roomDeals.find((d) => d.id === targetDealId) : null
      const dealToSelect = matchedDeal || roomDeals[0]
      if (dealToSelect) {
        await selectDeal(dealToSelect, { syncUrl: !matchedDeal })
      } else {
        setSelectedDeal(null)
        setTreeData(null)
      }
    } catch (err) {
      setAlert({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDeals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetDealId])

  const selectDeal = async (deal, { syncUrl = true } = {}) => {
    setSelectedDeal(deal)
    if (syncUrl && deal?.id) {
      setSearchParams({ dealId: deal.id }, { replace: true })
    }
    try {
      const tree = await api.getNegotiationTree(deal.id)
      const raw = tree?.timeline || tree?.steps || tree?.offers || []
      if (raw.length) {
        setFullTimeline(raw)
        setTreeData({
          ...tree,
          timeline: bilateralTimeline(raw, myId, myName),
        })
      } else {
        setFullTimeline([...fallbackBilateralTimeline(deal, myName), ...fallbackPeerOffers(deal)])
        setTreeData({ deal_id: deal.id, timeline: fallbackBilateralTimeline(deal, myName) })
      }
    } catch {
      setFullTimeline([...fallbackBilateralTimeline(deal, myName), ...fallbackPeerOffers(deal)])
      setTreeData({ deal_id: deal.id, timeline: fallbackBilateralTimeline(deal, myName) })
    }
  }

  const handleOpenOfferModal = () => {
    if (!isVerified) {
      setShowGatingModal(true)
      return
    }
    setOfferTerms({
      amount: selectedDeal?.target_raise || 750000,
      equity_pct: selectedDeal?.equity_pct || 7.0,
      royalty_pct: selectedDeal?.royalty_pct || 2.0,
      royalty_payout_terms: selectedDeal?.royalty_payout_terms || '2.0% quarterly revenue until 1.8x return cap',
      message: `Lead syndicate proposal submitted by ${user?.full_name || 'Investor'}.`,
    })
    setOfferModal(true)
  }

  const handleSubmitOffer = async (e) => {
    e.preventDefault()
    if (!selectedDeal) return
    if (!isVerified) {
      setShowGatingModal(true)
      return
    }

    setActionLoading(true)
    try {
      await api.createOffer(selectedDeal.id, {
        investor_id: user?.investor_id || 'investor-elena',
        investor_name: `${user?.full_name || 'Investor'} (${user?.firm || 'Syndicate'})`,
        sender_type: 'investor',
        amount: Number(offerTerms.amount),
        equity_pct: Number(offerTerms.equity_pct),
        royalty_pct: Number(offerTerms.royalty_pct),
        royalty_payout_terms: offerTerms.royalty_payout_terms,
        message: offerTerms.message,
      })
      setAlert({ type: 'success', text: 'Offer submitted into the live dealroom.' })
      setOfferModal(false)
      const tree = await api.getNegotiationTree(selectedDeal.id)
      const raw = tree?.timeline || []
      if (raw.length) {
        setFullTimeline(raw)
        setTreeData({ ...tree, timeline: bilateralTimeline(raw, myId, myName) })
      } else {
        setFullTimeline([...fallbackBilateralTimeline(selectedDeal, myName), ...fallbackPeerOffers(selectedDeal)])
        setTreeData({ deal_id: selectedDeal.id, timeline: fallbackBilateralTimeline(selectedDeal, myName) })
      }
      await loadDeals()
    } catch (err) {
      setAlert({ type: 'error', text: err.message })
    } finally {
      setActionLoading(false)
    }
  }

  const handleAcceptCounter = async (offerId) => {
    if (!selectedDeal) return
    if (!isVerified) {
      setShowGatingModal(true)
      return
    }
    setActionLoading(true)
    try {
      const res = await api.respondOffer(selectedDeal.id, offerId, { action: 'accept' })
      setAlert({ type: 'success', text: res.message || 'Counter-offer accepted. Deal closed.' })
      await loadDeals()
      const updatedDeal = await api.getDeal(selectedDeal.id)
      setSelectedDeal(updatedDeal)
      const tree = await api.getNegotiationTree(selectedDeal.id)
      const raw = tree?.timeline || []
      setFullTimeline(raw)
      setTreeData({ ...tree, timeline: bilateralTimeline(raw, myId, myName) })
    } catch (err) {
      setAlert({ type: 'error', text: err.message })
    } finally {
      setActionLoading(false)
    }
  }

  const filteredDeals = useMemo(() => {
    const q = companySearch.trim().toLowerCase()
    if (!q) return deals
    return deals.filter(
      (d) =>
        d.startup_name?.toLowerCase().includes(q) ||
        d.title?.toLowerCase().includes(q) ||
        d.industry?.toLowerCase().includes(q)
    )
  }, [deals, companySearch])

  const recentPeerOffers = useMemo(() => {
    const investorOffers = (fullTimeline || [])
      .filter((s) => s.sender_type === 'investor')
      .filter((s) => !matchesInvestor(s, myId, myName))
      .slice()
      .sort((a, b) => {
        const ta = new Date(a.timestamp || a.created_at || 0).getTime()
        const tb = new Date(b.timestamp || b.created_at || 0).getTime()
        return tb - ta
      })
      .slice(0, 5)

    if (investorOffers.length > 0) return investorOffers
    return fallbackPeerOffers(selectedDeal || {})
  }, [fullTimeline, myId, myName, selectedDeal, clock])

  const liveCount = deals.filter((d) => d.status !== 'closed').length

  return (
    <div className="space-y-3 pb-6">
      <div className="flex flex-col gap-2 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight">Dealroom</h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
              Live bidding
            </span>
            <VerificationBadge isVerified={isVerified} size="sm" />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {liveCount} active rooms · pick a company tab to negotiate
          </p>
        </div>
        {selectedDeal && selectedDeal.status !== 'closed' && (
          <Button size="sm" className="h-8 text-xs" onClick={handleOpenOfferModal}>
            <Handshake className="size-3.5" />
            Submit offer
          </Button>
        )}
      </div>

      {alert && (
        <div
          className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium ${
            alert.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          <span>{alert.text}</span>
          <button type="button" onClick={() => setAlert(null)} className="ml-2 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Company tabs + search */}
      <div className="rounded-xl border bg-card p-2.5 shadow-sm">
        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              placeholder="Search companies…"
              className="h-8 pl-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Activity className="h-3 w-3 text-emerald-600" />
            <span className="tabular-nums">{filteredDeals.length} companies</span>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {filteredDeals.map((d) => {
            const selected = selectedDeal?.id === d.id
            const negotiating = d.status === 'negotiating' || d.status === 'active' || d.id === 'deal-aerogrid'
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => selectDeal(d)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-left transition ${
                  selected
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                    : 'border-border bg-background text-foreground hover:bg-accent'
                }`}
              >
                <span className="max-w-[9rem] truncate text-xs font-semibold">{d.startup_name}</span>
                {negotiating && d.status !== 'closed' && (
                  <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-emerald-500" />
                )}
                {d.status === 'closed' && (
                  <Badge variant="secondary" className="h-4 px-1 text-[9px]">
                    Closed
                  </Badge>
                )}
              </button>
            )
          })}
          {!loading && filteredDeals.length === 0 && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">No companies match.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-12">
        {/* Main negotiation */}
        <div className="space-y-3 lg:col-span-8">
          {selectedDeal ? (
            <>
              <div className="rounded-xl border bg-card p-3 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {selectedDeal.funding_stage} · {selectedDeal.industry}
                    </p>
                    <h2 className="mt-0.5 truncate text-sm font-semibold">{selectedDeal.title}</h2>
                    <p className="text-xs font-medium text-emerald-800">{selectedDeal.startup_name}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-center text-[11px]">
                    <div className="rounded-md border bg-muted/40 px-2 py-1">
                      <p className="text-[9px] uppercase text-muted-foreground">Target</p>
                      <p className="font-semibold tabular-nums">${(Number(selectedDeal.target_raise) || 0).toLocaleString()}</p>
                    </div>
                    <div className="rounded-md border bg-muted/40 px-2 py-1">
                      <p className="text-[9px] uppercase text-muted-foreground">Equity</p>
                      <p className="font-semibold text-emerald-800">{selectedDeal.equity_pct}%</p>
                    </div>
                    <div className="rounded-md border bg-muted/40 px-2 py-1">
                      <p className="text-[9px] uppercase text-muted-foreground">Royalty</p>
                      <p className="font-semibold text-amber-800">{selectedDeal.royalty_pct || 0}%</p>
                    </div>
                  </div>
                </div>
              </div>

              <NegotiationArenaTree
                timeline={treeData?.timeline || treeData?.steps || treeData?.offers}
                deal={selectedDeal}
                userRole="investor"
                actionLoading={actionLoading}
                onAccept={handleAcceptCounter}
                onCounter={handleOpenOfferModal}
                compact
              />
            </>
          ) : (
            <div className="rounded-xl border border-dashed bg-card p-10 text-center text-xs text-muted-foreground">
              {loading ? 'Opening dealroom…' : 'Select a company tab to open negotiations.'}
            </div>
          )}
        </div>

        {/* Right: peer bids on this company */}
        <div className="lg:col-span-4">
          <div className="sticky top-20 space-y-2 rounded-xl border bg-card p-3 shadow-sm">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold">
                <Users className="h-3.5 w-3.5 text-primary" />
                Recent bids on company
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                Live
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Last 5 investor offers on {selectedDeal?.startup_name || 'this company'}
            </p>

            <div className="space-y-1.5">
              {selectedDeal &&
                recentPeerOffers.map((offer, idx) => (
                  <div
                    key={offer.id || idx}
                    className="rounded-lg border bg-muted/30 px-2.5 py-2 transition hover:border-primary/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">
                          {offer.investor_name || offer.sender_name || 'Investor'}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{relativeTime(offer.timestamp || offer.created_at)}</p>
                      </div>
                      <p className="shrink-0 text-xs font-semibold tabular-nums text-emerald-800">
                        ${(Number(offer.amount) || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px]">
                      <span className="rounded border bg-background px-1.5 py-0.5 font-medium">
                        {offer.equity_pct}% eq
                      </span>
                      <span className="rounded border bg-background px-1.5 py-0.5 font-medium">
                        {offer.royalty_pct}% roy
                      </span>
                      <span className="rounded border bg-background px-1.5 py-0.5 uppercase text-muted-foreground">
                        {offer.status || 'open'}
                      </span>
                    </div>
                  </div>
                ))}

              {!selectedDeal && (
                <p className="py-6 text-center text-xs text-muted-foreground">Select a company to see peer bids.</p>
              )}
              {selectedDeal && recentPeerOffers.length === 0 && (
                <p className="py-6 text-center text-xs text-muted-foreground">No other investor bids yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {offerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md space-y-3 rounded-xl border bg-card p-4 shadow-xl">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-semibold">Submit offer</h3>
              <button type="button" onClick={() => setOfferModal(false)} className="text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmitOffer} className="space-y-2.5 text-xs">
              <div>
                <label className="mb-1 block font-medium">Check size ($)</label>
                <Input
                  type="number"
                  required
                  value={offerTerms.amount}
                  onChange={(e) => setOfferTerms({ ...offerTerms, amount: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block font-medium">Equity %</label>
                  <Input
                    type="number"
                    step="0.1"
                    required
                    value={offerTerms.equity_pct}
                    onChange={(e) => setOfferTerms({ ...offerTerms, equity_pct: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium">Royalty %</label>
                  <Input
                    type="number"
                    step="0.1"
                    required
                    value={offerTerms.royalty_pct}
                    onChange={(e) => setOfferTerms({ ...offerTerms, royalty_pct: e.target.value })}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block font-medium">Royalty terms</label>
                <Input
                  type="text"
                  value={offerTerms.royalty_payout_terms}
                  onChange={(e) => setOfferTerms({ ...offerTerms, royalty_payout_terms: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block font-medium">Message</label>
                <textarea
                  rows={2}
                  value={offerTerms.message}
                  onChange={(e) => setOfferTerms({ ...offerTerms, message: e.target.value })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 border-t pt-2">
                <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => setOfferModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-8 text-xs" disabled={actionLoading}>
                  {actionLoading ? 'Submitting…' : 'Issue offer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showGatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md space-y-3 rounded-xl border border-amber-200 bg-card p-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-900">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Verification required</h3>
                <p className="text-xs text-amber-800">AI CV verification needed to bid</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Upload your CV and get verified before submitting or accepting offers in the dealroom.
            </p>
            <div className="flex justify-end gap-2 border-t pt-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowGatingModal(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  setShowGatingModal(false)
                  navigate('/investor/profile')
                }}
              >
                Verify now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
