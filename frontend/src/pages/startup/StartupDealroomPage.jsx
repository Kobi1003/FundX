import { useEffect, useState } from 'react'
import { useAuthContext } from '../../context/AuthContext'
import api from '../../services/api'

export default function StartupDealroomPage() {
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

  // Counter offer state modal
  const [counterModal, setCounterModal] = useState(null)
  const [counterTerms, setCounterTerms] = useState({
    amount: '',
    equity_pct: '',
    royalty_pct: '',
    royalty_payout_terms: '',
    message: '',
  })

  const startupId = user?.startup_id || 'startup-aerogrid'

  const loadDeals = async () => {
    setLoading(true)
    try {
      const allDeals = await api.listDeals()
      const myDeals = allDeals.filter(
        (d) => d.startup_id === startupId || d.startup_name?.includes('AeroGrid')
      )
      setDeals(myDeals)
      if (myDeals.length > 0 && !selectedDeal) {
        selectDeal(myDeals[0])
      }
    } catch (err) {
      setAlert({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDeals()
  }, [startupId])

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

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMsg.trim() || !selectedDeal) return
    const roomId = `room-${selectedDeal.id.replace('deal-', '')}`
    try {
      const sent = await api.postMessage(roomId, {
        sender_id: user?.id || 'founder',
        sender_name: `${user?.full_name || 'Founder'} (${selectedDeal.startup_name})`,
        body: newMsg,
      })
      setMessages((prev) => [...prev, sent])
      setNewMsg('')
    } catch (err) {
      console.error(err)
    }
  }

  const handleAcceptOffer = async (offerId) => {
    if (!selectedDeal) return
    setActionLoading(true)
    try {
      const res = await api.respondOffer(selectedDeal.id, offerId, { action: 'accept' })
      setAlert({ type: 'success', text: res.message || 'Deal officially accepted and closed!' })
      // Reload deal
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

  const handleRejectOffer = async (offerId) => {
    if (!selectedDeal) return
    setActionLoading(true)
    try {
      await api.respondOffer(selectedDeal.id, offerId, { action: 'reject' })
      setAlert({ type: 'success', text: 'Offer rejected.' })
      const tree = await api.getNegotiationTree(selectedDeal.id)
      setTreeData(tree)
    } catch (err) {
      setAlert({ type: 'error', text: err.message })
    } finally {
      setActionLoading(false)
    }
  }

  const openCounterModal = (offer) => {
    setCounterModal(offer)
    setCounterTerms({
      amount: offer.amount,
      equity_pct: offer.equity_pct,
      royalty_pct: offer.royalty_pct,
      royalty_payout_terms: offer.royalty_payout_terms || selectedDeal?.royalty_payout_terms || '',
      message: `Founder Counter-Offer: Adjusting terms to align with operational burn plan.`,
    })
  }

  const submitCounterOffer = async (e) => {
    e.preventDefault()
    if (!selectedDeal || !counterModal) return
    setActionLoading(true)
    try {
      await api.respondOffer(selectedDeal.id, counterModal.id, {
        action: 'counter',
        counter_offer: {
          investor_id: counterModal.investor_id,
          investor_name: user?.full_name || 'Founder',
          sender_type: 'startup',
          amount: Number(counterTerms.amount),
          equity_pct: Number(counterTerms.equity_pct),
          royalty_pct: Number(counterTerms.royalty_pct),
          royalty_payout_terms: counterTerms.royalty_payout_terms,
          message: counterTerms.message,
        },
      })
      setAlert({ type: 'success', text: 'Counter-offer successfully submitted to investor!' })
      setCounterModal(null)
      const tree = await api.getNegotiationTree(selectedDeal.id)
      setTreeData(tree)
    } catch (err) {
      setAlert({ type: 'error', text: err.message })
    } finally {
      setActionLoading(false)
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
          <h1 className="text-2xl font-bold text-slate-900">Founder Dealroom</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time multi-party negotiation room with accredited venture investors. Manage active term sheets, counter-offers, and legal round closings.
          </p>
        </div>

        {/* Tab Toggle: Ongoing vs Closed */}
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
            Ongoing Deals ({ongoingDeals.length})
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
            Closed Deals ({closedDeals.length})
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

      {/* Main 2-Column Split: Deal Selector Left, Negotiation Room Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deals Selector (Left) */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            {activeTab === 'ongoing' ? 'Active Negotiation Rooms' : 'Closed Deal Archive'}
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
                <span className="font-semibold text-slate-500">{d.funding_stage || 'Seed'}</span>
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
              <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{d.title}</h3>
              <div className="mt-2 text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>${(Number(d.target_raise) || 0).toLocaleString()}</span>
                <span>{d.equity_pct}% Eq • {d.royalty_pct || 0}% Roy</span>
              </div>
            </div>
          ))}

          {displayedDeals.length === 0 && !loading && (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-300 rounded-xl">
              No {activeTab} deals found.
            </div>
          )}
        </div>

        {/* Negotiation Tree & Offers Feed (Right 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDeal ? (
            <>
              {/* Active Deal Summary Bar */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {selectedDeal.funding_stage} Round • {selectedDeal.industry}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-0.5">{selectedDeal.title}</h2>
                  </div>
                  <span
                    className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                      selectedDeal.status === 'closed'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    Status: {selectedDeal.status}
                  </span>
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
                      {selectedDeal.ai_score ? `${selectedDeal.ai_score}/100` : 'Evaluated'}
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
                      <h3 className="font-bold text-base text-purple-950">Investment Agreement Executed</h3>
                      <p className="text-xs text-purple-800">
                        This deal is officially funded and legally closed in the FundX Dealroom.
                      </p>
                    </div>
                  </div>

                  {selectedDeal.closed_terms && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-white p-4 border border-purple-100 text-xs">
                      <div>
                        <span className="text-purple-600 text-[10px] font-semibold">Investor</span>
                        <div className="font-bold text-slate-900 mt-0.5">
                          {selectedDeal.closed_terms.investor_name}
                        </div>
                      </div>
                      <div>
                        <span className="text-purple-600 text-[10px] font-semibold">Closed Amount</span>
                        <div className="font-bold text-slate-900 mt-0.5">
                          ${(Number(selectedDeal.closed_terms.final_amount) || 0).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-purple-600 text-[10px] font-semibold">Agreed Equity</span>
                        <div className="font-bold text-emerald-700 mt-0.5">
                          {selectedDeal.closed_terms.final_equity_pct}%
                        </div>
                      </div>
                      <div>
                        <span className="text-purple-600 text-[10px] font-semibold">Royalty terms</span>
                        <div className="font-bold text-amber-700 mt-0.5">
                          {selectedDeal.closed_terms.final_royalty_pct}% ({selectedDeal.closed_terms.royalty_payout_terms || 'Capped'})
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Negotiation Offers Timeline */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Negotiation Tree & Received Offers ({treeData?.timeline?.length || 0})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Step-by-step history of term adjustments, founder counters, and active offers.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {(treeData?.timeline || []).map((step) => {
                    const isStartup = step.sender_type === 'startup'
                    const isActive = step.status === 'active'
                    const isAccepted = step.status === 'accepted'

                    return (
                      <div
                        key={step.id}
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
                              ({isStartup ? 'Company Counter' : 'Investor Proposal'})
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

                        {/* Terms Pill */}
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

                        {/* Actions for Founder on Active Investor Offer */}
                        {isActive && !isStartup && selectedDeal.status !== 'closed' && (
                          <div className="mt-3 pt-3 border-t border-amber-200/60 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleRejectOffer(step.id)}
                              disabled={actionLoading}
                              className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 text-xs font-semibold transition cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => openCounterModal(step)}
                              disabled={actionLoading}
                              className="rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 text-xs font-bold transition cursor-pointer shadow-xs"
                            >
                              Counter-Offer Terms
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAcceptOffer(step.id)}
                              disabled={actionLoading}
                              className="rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-1.5 text-xs font-bold transition cursor-pointer shadow-xs"
                            >
                              Accept & Close Deal ✓
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Dealroom Real-Time Messages */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Investor Direct Chat</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
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
                    <p className="text-xs text-slate-400 italic">No chat messages yet.</p>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={newMsg}
                    onChange={(e) => setNewMsg(e.target.value)}
                    placeholder="Type message to investor syndicate..."
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
              Select a deal from the left to inspect its active negotiation tree.
            </div>
          )}
        </div>
      </div>

      {/* Counter Offer Modal */}
      {counterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-base">Submit Counter-Offer</h3>
              <button
                onClick={() => setCounterModal(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitCounterOffer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Raise Amount ($)</label>
                <input
                  type="number"
                  required
                  value={counterTerms.amount}
                  onChange={(e) => setCounterTerms({ ...counterTerms, amount: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Equity Offered (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={counterTerms.equity_pct}
                    onChange={(e) => setCounterTerms({ ...counterTerms, equity_pct: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Royalty (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={counterTerms.royalty_pct}
                    onChange={(e) => setCounterTerms({ ...counterTerms, royalty_pct: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Royalty Payout Terms</label>
                <input
                  type="text"
                  value={counterTerms.royalty_payout_terms}
                  onChange={(e) => setCounterTerms({ ...counterTerms, royalty_payout_terms: e.target.value })}
                  placeholder="e.g. 2.2% quarterly revenue until 2.0x return cap"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Note to Investor</label>
                <textarea
                  rows={2}
                  value={counterTerms.message}
                  onChange={(e) => setCounterTerms({ ...counterTerms, message: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCounterModal(null)}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Submitting...' : 'Dispatch Counter-Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
