import { motion } from 'framer-motion'

export default function NegotiationArenaTree({
  timeline = [],
  deal = null,
  userRole = 'startup',
  actionLoading = false,
  onAccept,
  onReject,
  onCounter,
}) {
  const steps =
    timeline && timeline.length > 0
      ? timeline
      : [
          {
            id: 'offer-1',
            sender_name: deal?.startup_name || 'Founder (Priya Sharma)',
            sender_type: 'startup',
            amount: deal?.target_raise || 750000,
            equity_pct: deal?.equity_pct || 7.0,
            royalty_pct: deal?.royalty_pct || 2.5,
            royalty_payout_terms: deal?.royalty_payout_terms || '2.5% quarterly revenue until 2.0x return cap',
            status: 'superseded',
            message: 'Initial published marketplace offering terms.',
          },
          {
            id: 'offer-2',
            sender_name: 'Investor (Venture Horizon)',
            sender_type: 'investor',
            amount: 800000,
            equity_pct: 8.0,
            royalty_pct: 2.0,
            royalty_payout_terms: '2.0% quarterly revenue until 1.8x return cap',
            status: 'countered',
            message: 'We offer $800k total round commitment with 8.0% equity and reduced royalty of 2.0% (1.8x cap).',
          },
          {
            id: 'offer-3',
            sender_name: 'Founder (Priya Sharma)',
            sender_type: 'startup',
            amount: 800000,
            equity_pct: 7.5,
            royalty_pct: 2.2,
            royalty_payout_terms: '2.2% quarterly revenue until 2.0x return cap',
            status: 'active',
            message: 'Adjusted equity to 7.5% with 2.2% royalty cap as final compromise.',
          },
        ]

  const activeOffer = steps.find((s) => s.status === 'active') || steps[steps.length - 1]
  const isClosed = deal?.status === 'closed'

  return (
    <motion.section
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs"
      data-purpose="negotiation-tree"
    >
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Negotiation Arena & Bidding History</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {steps.length} Rounds
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Live two-sided back-and-forth negotiation between Founder and Investor with concession tracking.
            </p>
          </div>

          {/* Participant Badges */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-slate-50 p-1.5 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
              <div className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[9px] font-black flex items-center justify-center">
                PS
              </div>
              <span>Founder ({deal?.startup_name || 'Priya Sharma'})</span>
            </div>
            <div className="text-slate-300 font-bold">⇄</div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold">
              <div className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">
                VH
              </div>
              <span>Investor ({activeOffer?.investor_name || 'Venture Horizon'})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Tree container */}
      <div className="relative py-2">
        {/* Central connecting vertical beam for desktop */}
        <div
          aria-hidden="true"
          className="hidden md:block absolute top-6 bottom-6 left-1/2 w-0.5 bg-gradient-to-b from-slate-200 via-slate-300 to-emerald-400 -translate-x-1/2"
        />

        <div className="space-y-8">
          {steps.map((step, idx) => {
            const isStartup = step.sender_type === 'startup'
            const isActive = step.status === 'active'
            const isAccepted = step.status === 'accepted' || isClosed
            const roundNum = idx + 1

            // Display active round card differently
            if (isActive && !isClosed) {
              return (
                <motion.div
                  key={step.id || idx}
                  initial={{ opacity: 0, scale: 0.96, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="relative"
                >
                  <div className="hidden md:flex justify-center mb-3">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      {userRole === 'startup'
                        ? "BALL IN FOUNDER'S COURT • AWAITING FINAL DECISION"
                        : "BALL IN INVESTOR'S COURT • AWAITING FINAL DECISION"}
                    </span>
                  </div>

                  <div className="border-2 border-emerald-500 bg-emerald-50/30 ring-4 ring-amber-100/60 rounded-2xl p-6 shadow-md">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-emerald-200/60">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                          R{roundNum}
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900 uppercase tracking-wide">
                            Round {roundNum}: Active Closing Compromise
                          </div>
                          <div className="text-xs text-amber-800 font-semibold">
                            {isStartup ? 'Final compromise proposal awaiting founder execution' : 'Proposal awaiting investor sign-off'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="bg-amber-100 text-amber-800 font-extrabold px-3 py-1 rounded-full text-xs ring-1 ring-amber-300 animate-pulse uppercase tracking-wider">
                          ACTIVE
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 text-left">
                      <div className="bg-white/90 p-3.5 rounded-xl border border-amber-200 shadow-xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Capital</span>
                        <span className="text-lg font-black text-slate-900">${(Number(step.amount) || 0).toLocaleString()}</span>
                        <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">Round Commitment</span>
                      </div>
                      <div className="bg-white/90 p-3.5 rounded-xl border border-amber-200 shadow-xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Equity</span>
                        <span className="text-lg font-black text-emerald-700">{step.equity_pct}%</span>
                        <span className="text-[10px] font-semibold text-emerald-800 block mt-0.5">Equity Stake</span>
                      </div>
                      <div className="bg-white/90 p-3.5 rounded-xl border border-amber-200 shadow-xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Royalty</span>
                        <span className="text-lg font-black text-amber-700">{step.royalty_pct}%</span>
                        <span className="text-[10px] font-semibold text-amber-900 block mt-0.5">Revenue Share</span>
                      </div>
                      <div className="bg-white/90 p-3.5 rounded-xl border border-amber-200 shadow-xs">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Payout</span>
                        <span className="text-xs font-semibold text-slate-700 leading-snug block mt-0.5">
                          {step.royalty_payout_terms || 'Standard quarterly terms'}
                        </span>
                      </div>
                    </div>

                    {step.message && (
                      <div className="bg-white rounded-xl px-4 py-3 border border-amber-200 text-xs text-slate-700 font-medium italic">
                        &ldquo;{step.message}&rdquo;
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="mt-5 pt-4 border-t border-emerald-200/80 flex flex-wrap items-center justify-end gap-3">
                      {onReject && (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => onReject(step.id)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-bold text-xs transition cursor-pointer disabled:opacity-50"
                        >
                          Reject
                        </button>
                      )}
                      {onCounter && (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => onCounter(step)}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-5 py-2.5 rounded-lg text-xs shadow-sm transition cursor-pointer disabled:opacity-50"
                        >
                          Counter-Offer Terms
                        </button>
                      )}
                      {onAccept && (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => onAccept(step.id)}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-6 py-2.5 rounded-lg text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          Accept & Close Deal ✓
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            }

            // Historical Round (Round 1, Round 2, etc.)
            const isLeft = isStartup
            return (
              <motion.div
                key={step.id || idx}
                initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center relative"
              >
                {/* Left side card if startup */}
                {isLeft ? (
                  <div className="md:col-span-6 md:pr-6">
                    <div className="border-l-4 border-emerald-500 bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition">
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                            Round {roundNum}: {step.sender_name || 'Initial Marketplace Terms'}
                          </span>
                        </div>
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide ${
                            isAccepted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {step.status ? step.status.toUpperCase() : 'SUPERSEDED'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-left">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Capital</span>
                          <span className="font-extrabold text-slate-900 text-sm">${(Number(step.amount) || 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Equity</span>
                          <span className="font-extrabold text-emerald-700 text-sm">{step.equity_pct}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Royalty</span>
                          <span className="font-extrabold text-amber-700 text-sm">{step.royalty_pct}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payout</span>
                          <span className="text-slate-600 font-medium text-[11px] leading-tight block mt-0.5 truncate">
                            {step.royalty_payout_terms || 'Standard'}
                          </span>
                        </div>
                      </div>
                      {step.message && (
                        <div className="mt-1 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 text-xs text-slate-600 italic">
                          &ldquo;{step.message}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="hidden md:block md:col-span-6"></div>
                )}

                {/* Timeline Center Node */}
                <div className="hidden md:flex md:col-span-12 absolute left-1/2 -translate-x-1/2 z-10 items-center justify-center">
                  <div
                    className={`flex items-center gap-1 bg-white px-2.5 py-1 rounded-full border-2 ${
                      isLeft ? 'border-emerald-400' : 'border-amber-400'
                    } shadow-sm text-[11px] font-black text-slate-700`}
                  >
                    {isLeft && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
                    <span>R{roundNum}</span>
                    {isLeft ? (
                      <span className="text-emerald-700 font-bold">→</span>
                    ) : (
                      <span className="text-amber-600 font-bold">←</span>
                    )}
                    {!isLeft && <span className="w-2 h-2 rounded-full bg-amber-500"></span>}
                  </div>
                </div>

                {/* Right side card if investor */}
                {!isLeft ? (
                  <div className="md:col-span-6 md:pl-6">
                    <div className="border-r-4 border-amber-500 bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition">
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900 uppercase tracking-wide">
                            Round {roundNum}: {step.sender_name || 'Investor Counter-Proposal'}
                          </span>
                        </div>
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide ${
                            isAccepted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {step.status ? step.status.toUpperCase() : 'COUNTERED'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-left">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Capital</span>
                          <span className="font-extrabold text-slate-900 text-sm">${(Number(step.amount) || 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Equity</span>
                          <span className="font-extrabold text-emerald-700 text-sm">{step.equity_pct}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Royalty</span>
                          <span className="font-extrabold text-amber-700 text-sm">{step.royalty_pct}%</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payout</span>
                          <span className="text-slate-600 font-medium text-[11px] leading-tight block mt-0.5 truncate">
                            {step.royalty_payout_terms || 'Standard'}
                          </span>
                        </div>
                      </div>
                      {step.message && (
                        <div className="mt-1 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 text-xs text-slate-600 italic">
                          &ldquo;{step.message}&rdquo;
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="hidden md:block md:col-span-6"></div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.section>
  )
}
