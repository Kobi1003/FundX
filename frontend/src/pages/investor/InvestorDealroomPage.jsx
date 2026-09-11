import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import api from '../../services/api'
import VerificationBadge from '../../components/VerificationBadge'

export default function InvestorDealroomPage() {
  const navigate = useNavigate()
  const { user } = useAuthContext()

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
      // Deals that are negotiating or published or closed
      const roomDeals = allDeals.filter((d) => d.status !== 'draft')
      setDeals(roomDeals)
      if (roomDeals.length > 0 && !selectedDeal) {
        selectDeal(roomDeals[0])
      }
    } catch (err) {
      setAlert({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDeals()
  }, [])

  const selectDeal = async (deal) => {
    setSelectedDeal(deal)
    try {
      const tree = await api.getNegotiationTree(deal.id)
      setTreeData(tree)
      const msgs = await api.listMessages(`room-${deal.id.replace('deal-', '')}`)
      setMessages(msgs || [])
    } catch {
      // fallback
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

  const ongoingDeals = deals.filter((d) => d.status !== 'closed')
  const closedDeals = deals.filter((d) => d.status === 'closed')
  const displayedDeals = activeTab === 'ongoing' ? ongoingDeals : closedDeals

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Investor Dealroom & Negotiations</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track multi-party term sheet progression, inspect visual negotiation trees, and execute investment rounds.
          </p>
        </div>

        {/* Tab Toggle: Ongoing vs Closed */}
        <div className="flex items-center gap-3">
          <VerificationBadge isVerified={isVerified} size="md" />
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('ongoing')}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === 'ongoing'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ongoing ({ongoingDeals.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('closed')}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === 'closed'
                  ? 'bg-[#0f3d2e] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Closed ({closedDeals.length})
            </button>
          </div>
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
        {/* Deal Selector Left */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            {activeTab === 'ongoing' ? 'Active Dealrooms' : 'Closed Deal Archive'}
          </h2>

          {displayedDeals.map((d) => (
            <div
              key={d.id}
              onClick={() => selectDeal(d)}
              className={`p-4 rounded-xl border cursor-pointer transition ${
                selectedDeal?.id === d.id
                  ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500'
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
                <span className="text-emerald-700">{d.equity_pct}% Eq • {d.royalty_pct || 0}% Roy</span>
              </div>
            </div>
          ))}

          {displayedDeals.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-300 rounded-xl">
              No {activeTab} deals in dealroom.
            </div>
          )}
        </div>

        {/* Negotiation Tree & Offers Right */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDeal ? (
            <>
              {/* Summary Bar */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {selectedDeal.funding_stage} Round • {selectedDeal.industry}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-0.5">{selectedDeal.title}</h2>
                    <span className="text-xs text-slate-500">{selectedDeal.startup_name}</span>
                  </div>

                  {selectedDeal.status !== 'closed' && (
                    <button
                      type="button"
                      onClick={handleOpenOfferModal}
                      className="rounded-xl bg-[#0f3d2e] hover:bg-[#165540] text-white px-4 py-2 text-xs font-bold transition shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      + Make / Counter Offer
                    </button>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Target Raise</span>
                    <div className="font-bold text-slate-900 mt-0.5">
                      ${(Number(selectedDeal.target_raise) || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Equity</span>
                    <div className="font-bold text-emerald-700 mt-0.5">{selectedDeal.equity_pct}%</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">Royalty</span>
                    <div className="font-bold text-amber-700 mt-0.5">{selectedDeal.royalty_pct || 0}%</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg">
                    <span className="text-slate-400 text-[10px] uppercase font-semibold">AI Feasibility</span>
                    <div className="font-bold text-emerald-700 mt-0.5">
                      {selectedDeal.ai_score ? `${selectedDeal.ai_score}/100` : '88/100'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Closed Deal Binder Callout */}
              {selectedDeal.status === 'closed' && (
                <div className="rounded-2xl border border-purple-200 bg-purple-50/80 p-6 shadow-xs">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-200 text-purple-900 font-bold text-lg">
                      🤝
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-purple-950">Investment Executed & Funded</h3>
                      <p className="text-xs text-purple-800">
                        This deal is officially closed in the FundX multi-party dealroom.
                      </p>
                    </div>
                  </div>

                  {selectedDeal.closed_terms && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-white p-4 border border-purple-100 text-xs">
                      <div>
                        <span className="text-purple-600 text-[10px] font-semibold">Lead Investor</span>
                        <div className="font-bold text-slate-900 mt-0.5">
                          {selectedDeal.closed_terms.investor_name}
                        </div>
                      </div>
                      <div>
                        <span className="text-purple-600 text-[10px] font-semibold">Final Amount</span>
                        <div className="font-bold text-slate-900 mt-0.5">
                          ${(Number(selectedDeal.closed_terms.final_amount) || 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-purple-600 text-[10px] font-semibold">Equity</span>
                        <div className="font-bold text-emerald-700 mt-0.5">
                          {selectedDeal.closed_terms.final_equity_pct}%
                        </div>
                      </div>
                      <div>
                        <span className="text-purple-600 text-[10px] font-semibold">Royalty Terms</span>
                        <div className="font-bold text-amber-700 mt-0.5">
                          {selectedDeal.closed_terms.final_royalty_pct}% ({selectedDeal.closed_terms.royalty_payout_terms || 'Capped'})
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Visual Negotiation Tree */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Visual Negotiation Tree ({treeData?.timeline?.length || 0} Offers)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Step-by-step tree visualization of round offers, founder counters, and active terms.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 relative">
                  {(treeData?.timeline || []).map((step, idx) => {
                    const isStartup = step.sender_type === 'startup'
                    const isActive = step.status === 'active'
                    const isAccepted = step.status === 'accepted'

                    return (
                      <div
                        key={step.id || idx}
                        className={`rounded-xl border p-4 transition ${
                          isAccepted
                            ? 'border-emerald-300 bg-emerald-50/50'
                            : isActive
                            ? 'border-amber-300 bg-amber-50/30 shadow-xs'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{isStartup ? '🚀' : '💼'}</span>
                            <span className="font-bold text-slate-900">{step.sender_name}</span>
                            <span className="text-[10px] text-slate-400">
                              ({isStartup ? 'Startup Proposal / Counter' : 'Investor Term Sheet'})
                            </span>
                          </div>

                          <span
                            className={`self-start sm:self-auto rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              isAccepted
                                ? 'bg-emerald-100 text-emerald-800'
                                : isActive
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {step.status?.toUpperCase()}
                          </span>
                        </div>

                        {/* Terms Grid */}
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-800 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                          <div>
                            <span className="text-slate-400 text-[10px] block">Capital</span>
                            <span>${(Number(step.amount) || 0).toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Equity</span>
                            <span className="text-emerald-700">{step.equity_pct}%</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] block">Royalty</span>
                            <span className="text-amber-700">{step.royalty_pct}%</span>
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

                        {/* Action for Investor on Active Founder Counter */}
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
                              className="rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-1.5 text-xs font-bold transition cursor-pointer shadow-xs"
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
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Room Discussion Feed</h3>
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
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-[#0f3d2e] hover:bg-[#165540] text-white px-4 py-2 text-xs font-semibold transition cursor-pointer"
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
              Select a deal from the left to inspect the negotiation tree.
            </div>
          )}
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
