import { motion } from 'framer-motion'
import { Handshake } from 'lucide-react'

function statusTone(status, isClosed) {
  if (isClosed || status === 'accepted') return 'bg-emerald-100 text-emerald-800 border-emerald-200'
  if (status === 'active') return 'bg-amber-100 text-amber-900 border-amber-300'
  if (status === 'rejected') return 'bg-red-100 text-red-800 border-red-200'
  return 'bg-muted text-muted-foreground border-border'
}

function formatTime(ts) {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export default function NegotiationArenaTree({
  timeline = [],
  deal = null,
  userRole = 'startup',
  actionLoading = false,
  onAccept,
  onReject,
  onCounter,
  compact = true,
}) {
  const steps =
    timeline && timeline.length > 0
      ? timeline
      : [
          {
            id: 'offer-1',
            investor_name: deal?.startup_name || 'Founder',
            sender_type: 'startup',
            amount: deal?.target_raise || 750000,
            equity_pct: deal?.equity_pct || 7.0,
            royalty_pct: deal?.royalty_pct || 2.5,
            royalty_payout_terms: deal?.royalty_payout_terms || '2.5% quarterly until 2.0x',
            status: 'superseded',
            message: 'Initial marketplace terms.',
            timestamp: '2026-08-21T10:00:00Z',
          },
          {
            id: 'offer-2',
            investor_name: 'Investor',
            sender_type: 'investor',
            amount: 800000,
            equity_pct: 8.0,
            royalty_pct: 2.0,
            royalty_payout_terms: '2.0% quarterly until 1.8x',
            status: 'countered',
            message: '$800k / 8% equity / 2% royalty.',
            timestamp: '2026-08-23T14:20:00Z',
          },
          {
            id: 'offer-3',
            investor_name: deal?.startup_name || 'Founder',
            sender_type: 'startup',
            amount: 800000,
            equity_pct: 7.5,
            royalty_pct: 2.2,
            royalty_payout_terms: '2.2% quarterly until 2.0x',
            status: 'active',
            message: '7.5% equity / 2.2% royalty compromise.',
            timestamp: '2026-08-25T09:15:00Z',
          },
        ]

  const isClosed = deal?.status === 'closed'
  const activeOffer = steps.find((s) => s.status === 'active') || steps[steps.length - 1]

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`rounded-xl border bg-card shadow-sm ${compact ? 'p-3' : 'p-5'}`}
      data-purpose="negotiation-tree"
    >
      <div className={`flex flex-wrap items-center justify-between gap-2 ${compact ? 'mb-2 pb-2' : 'mb-4 pb-3'} border-b`}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`font-semibold tracking-tight ${compact ? 'text-sm' : 'text-base'}`}>
              Negotiation tree
            </h3>
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
              {isClosed ? 'Closed' : 'Live'}
            </span>
            <span className="rounded-full border bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {steps.length} offers
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {userRole === 'investor'
              ? `You ↔ ${deal?.startup_name || 'company'} · bilateral thread only`
              : `You ↔ investor · bilateral thread only`}
          </p>
        </div>
        {!isClosed && activeOffer?.status === 'active' && (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
            Your move
          </span>
        )}
      </div>

      {/* Column labels */}
      <div className="mb-1 hidden grid-cols-12 gap-2 px-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
        <div className="col-span-1">#</div>
        <div className="col-span-3">Party</div>
        <div className="col-span-2 text-right">Capital</div>
        <div className="col-span-1 text-right">Eq%</div>
        <div className="col-span-1 text-right">Roy%</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2 text-right">When</div>
      </div>

      <div className="space-y-1.5">
        {steps.map((step, idx) => {
          const isStartup = step.sender_type === 'startup'
          const isActive = step.status === 'active' && !isClosed
          const party = step.investor_name || step.sender_name || (isStartup ? 'Founder' : 'Investor')
          const roundNum = idx + 1

          return (
            <motion.div
              key={step.id || idx}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: idx * 0.04 }}
              className={`rounded-lg border px-2.5 py-2 transition ${
                isActive
                  ? 'border-amber-300 bg-amber-50/70 shadow-sm ring-1 ring-amber-200/80'
                  : isStartup
                    ? 'border-l-[3px] border-l-emerald-500 bg-card'
                    : 'border-l-[3px] border-l-amber-500 bg-card'
              }`}
            >
              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-12 sm:gap-2">
                <div className="col-span-1 flex items-center gap-1.5">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                      isStartup ? 'bg-emerald-700' : 'bg-amber-600'
                    }`}
                  >
                    {roundNum}
                  </span>
                  {isActive && (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500 sm:hidden" />
                  )}
                </div>

                <div className="col-span-3 min-w-0">
                  <p className="truncate text-xs font-semibold">{party}</p>
                  <p className="text-[10px] text-muted-foreground">{isStartup ? 'Founder' : 'Investor'}</p>
                </div>

                <div className="col-span-2 text-left sm:text-right">
                  <p className="text-xs font-semibold tabular-nums">${(Number(step.amount) || 0).toLocaleString()}</p>
                </div>
                <div className="col-span-1 text-left sm:text-right">
                  <p className="text-xs font-semibold tabular-nums text-emerald-800">{step.equity_pct}%</p>
                </div>
                <div className="col-span-1 text-left sm:text-right">
                  <p className="text-xs font-semibold tabular-nums text-amber-800">{step.royalty_pct}%</p>
                </div>

                <div className="col-span-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${statusTone(
                      step.status,
                      isClosed
                    )}`}
                  >
                    {isActive && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-600" />}
                    {step.status || 'open'}
                  </span>
                </div>

                <div className="col-span-2 text-left text-[10px] text-muted-foreground sm:text-right">
                  {formatTime(step.timestamp || step.created_at)}
                </div>
              </div>

              {(step.message || step.royalty_payout_terms) && (
                <p className="mt-1.5 line-clamp-1 text-[11px] text-muted-foreground">
                  {step.message || step.royalty_payout_terms}
                </p>
              )}

              {isActive && (onAccept || onCounter || onReject) && (
                <div className="mt-2 flex flex-wrap items-center justify-end gap-1.5 border-t border-amber-200/70 pt-2">
                  {onReject && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => onReject(step.id)}
                      className="rounded-md bg-muted px-2.5 py-1 text-[11px] font-semibold text-foreground transition hover:bg-muted/80 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  )}
                  {onCounter && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => onCounter(step)}
                      className="inline-flex items-center gap-1 rounded-md bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-amber-950 transition hover:bg-amber-600 disabled:opacity-50"
                    >
                      <Handshake className="h-3 w-3" />
                      Counter
                    </button>
                  )}
                  {onAccept && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => onAccept(step.id)}
                      className="rounded-md bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50"
                    >
                      Accept & close
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>
    </motion.section>
  )
}
