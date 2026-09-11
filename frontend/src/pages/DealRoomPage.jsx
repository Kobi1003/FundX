import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import Card from '../components/Card'
import Button from '../components/Button'
import LoadingState from '../components/LoadingState'
import ErrorState from '../components/ErrorState'
import { api } from '../services/api'
import {
  Handshake,
  ArrowLeft,
  Send,
  Sparkles,
  ShieldCheck,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Bot,
} from 'lucide-react'

export default function DealRoomPage() {
  const { id } = useParams()
  const [room, setRoom] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  // Negotiation interactive state
  const [messages, setMessages] = useState([
    { sender: 'Apex Horizon Ventures', text: 'We reviewed your AI Intelligence Report V2 and would like to submit a term sheet.', time: '10:14 AM' },
    { sender: 'Apex Horizon Ventures', text: 'Offer: ₹1.0 Cr for 10% Equity + 2% Royalty until 1.5x payout.', offer: true, amount: '₹1.0 Cr', equity: '10%', status: 'COUNTERED', time: '10:15 AM' },
    { sender: 'QuantumLedger Founder', text: 'Thank you for the offer. Our AI simulation supports ₹9.0 Cr Pre-money valuation. We counter with 8% equity.', time: '10:22 AM' },
  ])
  const [newMsg, setNewMsg] = useState('')

  // Copilot advice state
  const [copilotAdvice, setCopilotAdvice] = useState(null)
  const [askingCopilot, setAskingCopilot] = useState(false)

  useEffect(() => {
    api
      .getDealRoom(id)
      .then(setRoom)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  function sendMessage(e) {
    e.preventDefault()
    if (!newMsg.trim()) return
    setMessages((prev) => [
      ...prev,
      { sender: 'You (Founder)', text: newMsg, time: 'Just now' },
    ])
    setNewMsg('')
  }

  function triggerCopilot() {
    setAskingCopilot(true)
    setTimeout(() => {
      setCopilotAdvice({
        valuation_analysis: 'Proposed ₹1.0 Cr for 10% equity implies ₹10.0 Cr post-money valuation.',
        evaluation: 'The offer is reasonable and aligns closely with the Base Case financial simulation (₹71L 18M Rev).',
        recommendation: 'Consider countering with 8.5% equity or waiving the 2% royalty clause.',
      })
      setAskingCopilot(false)
    }, 600)
  }

  return (
    <PageContainer
      title="Digital Deal Room & Negotiation Arena"
      description={`Multi-Party Negotiation Environment • Room ID: ${id}`}
      action={
        <Link to="/deals">
          <Button variant="ghost" className="text-xs">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Deals</span>
          </Button>
        </Link>
      }
    >
      {loading && <LoadingState label="Connecting to secure deal room portal…" />}
      {error && <ErrorState message={error} />}

      {!loading && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Deal Room Chat & Term Sheet Stream */}
          <div className="lg:col-span-2 space-y-4">
            <Card title="Live Term Sheet & Discussion Stream" hover={false}>
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl p-4 text-xs ${
                      m.offer
                        ? 'border border-emerald-500/30 bg-emerald-500/10'
                        : 'border border-slate-800 bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-bold text-slate-200">{m.sender}</span>
                      <span className="text-[10px] text-slate-500">{m.time}</span>
                    </div>

                    <p className="text-slate-300 leading-relaxed">{m.text}</p>

                    {m.offer && (
                      <div className="mt-3 flex items-center justify-between border-t border-emerald-500/20 pt-2 text-xs">
                        <div className="flex gap-4">
                          <span className="text-slate-300">Amount: <strong className="text-white">{m.amount}</strong></span>
                          <span className="text-slate-300">Equity: <strong className="text-emerald-400">{m.equity}</strong></span>
                        </div>
                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                          {m.status}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Message Input Box */}
              <form onSubmit={sendMessage} className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Type message or counter-offer term proposal…"
                  className="glass-input flex-1 px-3.5 py-2 text-xs"
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                />
                <Button type="submit" variant="primary" className="text-xs px-4">
                  <Send className="h-3.5 w-3.5" />
                  <span>Send</span>
                </Button>
              </form>
            </Card>
          </div>

          {/* AI Negotiation Copilot Sidebar (Roadmap Phase 11) */}
          <div className="space-y-4">
            <Card title="AI Negotiation Copilot" subtitle="Assists both parties with deterministic calculations." hover={false}>
              <div className="space-y-4">
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-xs">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
                    <Bot className="h-4 w-4" />
                    <span>AI Copilot Active</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    AI evaluates offers against deterministic Python valuation models. It never autonomously accepts/rejects deals.
                  </p>
                </div>

                <Button
                  variant="outline"
                  className="w-full text-xs py-2.5"
                  onClick={triggerCopilot}
                  disabled={askingCopilot}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{askingCopilot ? 'Calculating Valuation…' : 'Evaluate Current Offer'}</span>
                </Button>

                {copilotAdvice && (
                  <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-xs">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span>Copilot Intelligence Advice</span>
                    </p>
                    <div className="space-y-2 pt-2 border-t border-slate-800 text-[11px]">
                      <p><strong className="text-slate-300">Valuation:</strong> <span className="text-emerald-400 font-semibold">{copilotAdvice.valuation_analysis}</span></p>
                      <p><strong className="text-slate-300">Assessment:</strong> <span className="text-slate-300">{copilotAdvice.evaluation}</span></p>
                      <p><strong className="text-slate-300">Strategy:</strong> <span className="text-cyan-400">{copilotAdvice.recommendation}</span></p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
