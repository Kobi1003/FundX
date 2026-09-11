export default function VerificationBadge({
  isVerified,
  status,
  score,
  size = 'md',
  showScore = false,
}) {
  const verified = isVerified || status === 'verified'
  const isPending = status === 'pending' || status === 'action_required'

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }[size]

  if (verified) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300/80 shadow-xs ${sizeClasses}`}
        title={`AI Verified${score ? ` • Score: ${score}/100` : ''}`}
      >
        <svg
          className="w-3.5 h-3.5 text-emerald-600 fill-current"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span>AI Verified</span>
        {showScore && score && (
          <span className="ml-0.5 rounded bg-emerald-200/60 px-1 py-0.2 text-[10px] font-bold text-emerald-800">
            {score}
          </span>
        )}
      </span>
    )
  }

  if (isPending) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-amber-50 text-amber-800 border border-amber-300 shadow-xs ${sizeClasses}`}
      >
        <svg
          className="w-3.5 h-3.5 text-amber-600 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" />
        </svg>
        <span>Pending Review</span>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-300 shadow-xs ${sizeClasses}`}
      title="Unverified"
    >
      <svg
        className="w-3.5 h-3.5 text-slate-400"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      <span>Unverified</span>
    </span>
  )
}
