import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import api from '../../services/api'
import VerificationBadge from '../../components/VerificationBadge'
import {
  Handshake,
  Building2,
  FileCheck2,
  Send,
  Sparkles,
  TrendingUp,
  Clock,
  UserCheck,
  ShieldAlert,
} from 'lucide-react'

const recentDealsFromOtherInvestors = [
  {
    id: 'recent-1',
    investor_name: 'Vikram Mehta',
    firm: 'Nexus Angel Syndicate',
    startup_name: 'AeroGrid Tech',
    deal_title: 'Autonomous Renewable Microgrid Grid-Edge Infrastructure',
    amount: 800000,
    equity_pct: 7.5,
    royalty_pct: 2.2,
    status: 'In Active Negotiation',
    time: '2 hours ago',
  },
  {
    id: 'recent-2',
    investor_name: 'Elena Rostova',
    firm: 'Apex Horizon Capital',
    startup_name: 'FinPulse AI',
    deal_title: 'Sub-second B2B Treasury & Global FX Settlement Protocol',
    amount: 1500000,
    equity_pct: 8.5,
    royalty_pct: 1.5,
    status: 'Term Sheet Executed',
    time: 'Yesterday',
  },
  {
    id: 'recent-3',
    investor_name: 'David Miller',
    firm: 'Private Angel Syndicate',
    startup_name: 'BioSynthetix Labs',
    deal_title: 'Generative Protein Design Platform for Targeted Oncology',
    amount: 400000,
    equity_pct: 6.0,
    royalty_pct: 3.0,
    status: 'Interest Registered',
    time: '1 day ago',
  },
  {
    id: 'recent-4',
    investor_name: 'Alex Mercer',
    firm: 'DeepTech Angel Group',
    startup_name: 'QuantumLedger AI',
    deal_title: 'Post-Quantum Cryptographic Audit Engine & Tokenization Protocol',
    amount: 1200000,
    equity_pct: 9.0,
    royalty_pct: 2.0,
    status: 'Offer Under Review',
    time: '2 days ago',
  },
  {
    id: 'recent-5',
    investor_name: 'Dr. Sarah Chen',
    firm: 'BioVentures Capital',
    startup_name: 'BioSynthetix Labs',
    deal_title: 'Generative Oncology Therapeutic Pipeline',
    amount: 500000,
    equity_pct: 7.0,
    royalty_pct: 2.5,
    status: 'Pre-Term Sheet',
    time: '3 days ago',
  },
]

export default function InvestorDealroomPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuthContext()

  const targetDealId = searchParams.get('dealId')

  const [deals, setDeals] = useState([])
  const [activeTab, setActiveTab] = useState('ongoing') // 'ongoing' or 'closed'
  const [selectedDeal, setSelectedDeal] = useState(null)
  const [treeData, setTreeData] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [alert, setAlert] = useState(null)
  const [showGatingModal, setShowGatingModal] = useState(false)

  // Offer submission modal
  const [offerModal, setOfferModal] = useState(false)
  const [offerTerms, setOfferTerms] = useState({
    amount: '',
    equity_pct: '',
    royalty_pct: '',
    royalty_payout_terms: '',
    message: '',
  })

  const isVerified = Boolean(user?.is_verified)

  const loadDeals = async () => {
    setLoading(true)
    try {
      const allDeals = await api.listDeals()
      const roomDeals = allDeals.filter((d) => d.status !== 'draft')
      setDeals(roomDeals)

      // Check if URL has specific dealId
      const matchedDeal = targetDealId ? roomDeals.find((d) => d.id === targetDealId) : null
      const dealToSelect = matchedDeal || roomDeals[0]

      if (dealToSelect) {
        selectDeal(dealToSelect)
      }
    } catch (err) {
      setAlert({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDeals()
  }, [targetDealId])

  const selectDeal = async (deal) => {
    setSelectedDeal(deal)
    try {
      const tree = await api.getNegotiationTree(deal.id)
      if (tree && (tree.timeline?.length || tree.steps?.length)) {
        setTreeData(tree)
      } else {
        setTreeData({
          deal_id: deal.id,
          timeline: [
            {
              id: 'offer-1',
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
              investor_name: 'Elena Rostova (Apex Horizon Capital)',
              sender_type: 'investor',
              amount: deal.target_raise || 750000,
              equity_pct: (deal.equity_pct || 7.0) - 0.5,
              royalty_pct: (deal.royalty_pct || 2.5) - 0.5,
              royalty_payout_terms: '2.0% quarterly revenue cap 1.8x',
              status: 'countered',
              message: 'Counter-offer based on AI simulation model.',
              timestamp: '2026-08-23T14:20:00Z',
            },
            {
              id: 'offer-3',
              investor_name: deal.startup_name || 'Founder',
              sender_type: 'startup',
              amount: deal.target_raise || 750000,
              equity_pct: (deal.equity_pct || 7.0) - 0.2,
              royalty_pct: (deal.royalty_pct || 2.5) - 0.3,
              royalty_payout_terms: '2.2% quarterly revenue cap 2.0x',
              status: 'active',
              message: 'Founders active counter-proposal ready for sign-off.',
              timestamp: '2026-08-25T09:15:00Z',
            },
          ],
        })
      }
      const msgs = await api.listMessages(`room-${deal.id.replace('deal-', '')}`)
      setMessages(msgs || [])
    } catch {
      setTreeData({
        deal_id: deal.id,
        timeline: [
          {
            id: 'offer-1',
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
            investor_name: 'Elena Rostova (Apex Horizon Capital)',
            sender_type: 'investor',
            amount: deal.target_raise || 750000,
            equity_pct: (deal.equity_pct || 7.0) - 0.5,
            royalty_pct: (deal.royalty_pct || 2.5) - 0.5,
            royalty_payout_terms: '2.0% quarterly revenue cap 1.8x',
            status: 'countered',
            message: 'Counter-offer based on AI simulation model.',
            timestamp: '2026-08-23T14:20:00Z',
          },
          {
            id: 'offer-3',
            investor_name: deal.startup_name || 'Founder',
            sender_type: 'startup',
            amount: deal.target_raise || 750000,
            equity_pct: (deal.equity_pct || 7.0) - 0.2,
            royalty_pct: (deal.royalty_pct || 2.5) - 0.3,
            royalty_payout_terms: '2.2% quarterly revenue cap 2.0x',
            status: 'active',
            message: 'Founders active counter-proposal ready for sign-off.',
            timestamp: '2026-08-25T09:15:00Z',
          },
        ],
      })
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
      setAlert({ type: 'success', text: 'Offer proposal successfully submitted into dealroom!' })
      setOfferModal(false)
      const tree = await api.getNegotiationTree(selectedDeal.id)
      setTreeData(tree)
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
      setAlert({ type: 'success', text: res.message || 'Counter-offer accepted! Deal closed.' })
      await loadDeals()
      const updatedDeal = await api.getDeal(selectedDeal.id)
      setSelectedDeal(updatedDeal)
      const tree = await api.getNegotiationTree(selectedDeal.id)
      setTreeData(tree)
    } catch (err) {
      setAlert({ type: 'error', text: err.message })
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMsg.trim() || !selectedDeal) return
    const roomId = `room-${selectedDeal.id.replace('deal-', '')}`
    try {
      const sent = await api.postMessage(roomId, {
        sender_id: user?.id || 'investor',
        sender_name: `${user?.full_name || 'Investor'} (${user?.firm || 'Syndicate'})`,
        body: newMsg,
      })
      setMessages((prev) => [...prev, sent])
      setNewMsg('')
    } catch (err) {
      console.error(err)
    }
  }

  const displayedDeals = deals.filter((d) =>
    activeTab === 'ongoing' ? d.status !== 'closed' : d.status === 'closed'
  )

  const steps = treeData?.timeline || treeData?.steps || treeData?.offers || []

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Investor Dealroom & Negotiations</h1>
            <VerificationBadge isVerified={isVerified} size="sm" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Negotiate company term sheets, submit counter-offers, and monitor recent market deals from other investors.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-slate-200/80 p-1 border border-slate-300">
          <button
            type="button"
            onClick={() => setActiveTab('ongoing')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeTab === 'ongoing'
                ? 'bg-[#0f3d2e] text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            Ongoing Deals ({deals.filter((d) => d.status !== 'closed').length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('closed')}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
              activeTab === 'closed'
                ? 'bg-[#0f3d2e] text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            Closed Portfolio ({deals.filter((d) => d.status === 'closed').length})
          </button>
        </div>
      </div>

      {alert && (
        <div
          className={`rounded-xl p-4 text-xs font-semibold flex items-center justify-between shadow-xs ${
            alert.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
              : 'bg-red-50 border border-red-300 text-red-900'
          }`}
        >
          <span>{alert.text}</span>
          <button onClick={() => setAlert(null)} className="font-bold ml-2 cursor-pointer">✕</button>
        </div>
      )}

      {/* Main Grid: Deal Selector Left, Negotiation Room Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal Selector Left Column */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            {activeTab === 'ongoing' ? 'Select Active Company Dealroom' : 'Closed Deal Archive'}
          </h2>

          {displayedDeals.map((d) => (
            <div
              key={d.id}
              onClick={() => selectDeal(d)}
              className={`p-4 rounded-2xl border cursor-pointer transition ${
                selectedDeal?.id === d.id
                  ? 'border-emerald-600 bg-emerald-50/60 shadow-xs ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-bold text-slate-900">{d.startup_name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    d.status === 'closed'
                      ? 'bg-purple-100 text-purple-700'
                      : d.status === 'negotiating'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {d.status?.toUpperCase()}
                </span>
              </div>
              <h3 className="font-semibold text-xs text-slate-700 line-clamp-1">{d.title}</h3>
              <div className="mt-2 text-xs font-semibold text-slate-900 flex items-center justify-between">
                <span>${(Number(d.target_raise) || 0).toLocaleString()}</span>
                <span className="text-emerald-800">{d.equity_pct}% Eq • {d.royalty_pct || 0}% Roy</span>
              </div>
            </div>
          ))}

          {displayedDeals.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-300 rounded-xl">
              No {activeTab} deals in dealroom.
            </div>
          )}
        </div>

        {/* Negotiation Tree & Room Workspace Right */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDeal ? (
            <>
              {/* Summary Bar */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {selectedDeal.funding_stage} Round • {selectedDeal.industry}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-0.5">{selectedDeal.title}</h2>
                    <span className="text-xs font-semibold text-emerald-800">{selectedDeal.startup_name}</span>
                  </div>

                  {selectedDeal.status !== 'closed' && (
                    <button
                      type="button"
                      onClick={handleOpenOfferModal}
                      className="rounded-xl bg-[#0f3d2e] hover:bg-[#165540] text-white px-4 py-2.5 text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                    >
                      <Handshake className="h-4 w-4" />
                      <span>+ Negotiate & Submit Offer</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">Target Raise</span>
                    <div className="font-black text-slate-900 mt-0.5">
                      ${(Number(selectedDeal.target_raise) || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">Equity</span>
                    <div className="font-black text-emerald-800 mt-0.5">{selectedDeal.equity_pct}%</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">Royalty</span>
                    <div className="font-black text-amber-800 mt-0.5">{selectedDeal.royalty_pct || 0}%</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold block">AI Score</span>
                    <div className="font-black text-emerald-800 mt-0.5">
                      {selectedDeal.ai_score ? `${selectedDeal.ai_score}/100` : '92/100'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Term Sheet Negotiation Tree */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Term Sheet Negotiation Progression</h3>
                    <p className="text-xs text-slate-500">Live offer progression history between founder and investors</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 text-emerald-900 text-[10px] font-bold px-2.5 py-0.5 border border-emerald-200">
                    {steps.length} Progression Steps
                  </span>
                </div>

                <div className="space-y-4 pt-1">
                  {steps.map((step, idx) => {
                    const isStartup = step.sender_type === 'startup'
                    const isActive = step.status === 'active'

                    return (
                      <div
                        key={step.id || idx}
                        className={`rounded-xl border p-4 transition ${
                          isActive
                            ? 'border-amber-400 bg-amber-50/40 shadow-xs'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{step.investor_name}</span>
                            <span className="text-[10px] text-slate-400">
                              ({isStartup ? 'Startup Founder' : 'Investor Syndicate'})
                            </span>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              step.status === 'active'
                                ? 'bg-amber-400 text-slate-950'
                                : step.status === 'accepted'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {step.status?.toUpperCase()}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-800 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                          <div>
                            <span className="text-slate-400 text-[10px] block">Capital</span>
                            <span>${(Number(step.amount) || 0).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Equity</span>
                            <span className="text-emerald-800">{step.equity_pct}%</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Royalty</span>
                            <span className="text-amber-800">{step.royalty_pct}%</span>
                          </div>
                          <div className="flex-1">
                            <span className="text-slate-400 text-[10px] block">Payout</span>
                            <span className="text-slate-600 truncate block">
                              {step.royalty_payout_terms || 'Standard'}
                            </span>
                          </div>
                        </div>

                        {step.message && (
                          <p className="mt-2.5 text-xs text-slate-600 italic leading-relaxed">
                            &ldquo;{step.message}&rdquo;
                          </p>
                        )}

                        {isActive && isStartup && selectedDeal.status !== 'closed' && (
                          <div className="mt-3 pt-3 border-t border-amber-200/60 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={handleOpenOfferModal}
                              className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 text-xs font-bold transition cursor-pointer shadow-xs"
                            >
                              Counter-Offer
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAcceptCounter(step.id)}
                              disabled={actionLoading}
                              className="rounded-lg bg-[#0f3d2e] hover:bg-[#165540] text-white px-4 py-1.5 text-xs font-bold transition cursor-pointer shadow-xs"
                            >
                              Accept Terms & Close Deal ✓
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Chat Feed */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Room Discussion Feed</h3>
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {messages.map((m) => (
                    <div key={m.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="font-bold text-slate-800">{m.sender_name}</span>
                        <span>{m.created_at ? new Date(m.created_at).toLocaleTimeString() : ''}</span>
                      </div>
                      <p className="text-slate-700">{m.body}</p>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <p className="text-xs text-slate-400 italic">No messages in room yet.</p>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="Send message to founder in room..."
                    className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-[#0f3d2e] hover:bg-[#165540] text-white px-4 py-2 text-xs font-bold transition cursor-pointer"
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
              Select a deal from the left to inspect the dealroom.
            </div>
          )}
        </div>
      </div>

      {/* RECENT 5 DEALS FROM OTHER INVESTORS */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span>Recent 5 Deals & Offers from Other Investors</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live market intelligence: recent syndicate proposals, counter-offers, and executed deals across the platform
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 text-emerald-900 text-[10px] font-bold px-2.5 py-1 border border-emerald-200 shrink-0 self-start sm:self-auto">
            Live Market Feed
          </span>
        </div>

        <div className="space-y-3">
          {recentDealsFromOtherInvestors.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 hover:border-emerald-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-900">{item.investor_name}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600 font-semibold">{item.firm}</span>
                  <span className="text-[10px] text-slate-400">({item.time})</span>
                </div>
                <p className="text-xs font-bold text-slate-900">
                  {item.startup_name} <span className="font-normal text-slate-600">— {item.deal_title}</span>
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right text-xs">
                  <div className="font-black text-slate-900">${(item.amount).toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-800 font-bold">
                    {item.equity_pct}% Equity • {item.royalty_pct}% Royalty
                  </div>
                </div>
                <span className="rounded-xl bg-[#0f3d2e] text-white text-[10px] font-bold px-3 py-1.5 shadow-2xs">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Investor Offer Modal */}
      {offerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Submit Term Sheet Offer</h3>
              <button
                onClick={() => setOfferModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitOffer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Check Size / Capital ($)</label>
                <input
                  type="number"
                  required
                  value={offerTerms.amount}
                  onChange={(e) => setOfferTerms({ ...offerTerms, amount: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Equity Requested (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={offerTerms.equity_pct}
                    onChange={(e) => setOfferTerms({ ...offerTerms, equity_pct: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Royalty (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={offerTerms.royalty_pct}
                    onChange={(e) => setOfferTerms({ ...offerTerms, royalty_pct: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Royalty Payout Terms</label>
                <input
                  type="text"
                  value={offerTerms.royalty_payout_terms}
                  onChange={(e) => setOfferTerms({ ...offerTerms, royalty_payout_terms: e.target.value })}
                  placeholder="e.g. 2.0% quarterly revenue until 1.8x return cap"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Proposal Message</label>
                <textarea
                  rows={2}
                  value={offerTerms.message}
                  onChange={(e) => setOfferTerms({ ...offerTerms, message: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOfferModal(false)}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-lg bg-[#0f3d2e] hover:bg-[#165540] text-white px-4 py-2 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Submitting...' : 'Issue Term Sheet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Verification Gating Modal */}
      {showGatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-amber-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 font-black text-2xl">
                🛡️
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Verification Mandatory</h3>
                <p className="text-xs text-amber-800 font-semibold">AI CV Verification Required to Negotiate</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              To issue term sheets, counter-offer, or execute binding agreements in the Dealroom, platform security requires accredited investor verification by uploading your CV.
            </p>

            <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowGatingModal(false)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowGatingModal(false)
                  navigate('/investor/profile')
                }}
                className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2 text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Upload CV & Verify Now →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
