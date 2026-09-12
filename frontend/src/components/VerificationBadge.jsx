import { CheckCircle2, Loader2, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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
    sm: 'h-6 px-2 text-[11px]',
    md: 'h-7 px-2.5 text-xs',
    lg: 'h-8 px-3 text-sm',
  }[size]

  if (verified) {
    return (
      <Badge
        variant="outline"
        title={`AI Verified${score ? ` • Score: ${score}/100` : ''}`}
        className={cn(
          'flex-nowrap border-emerald-200 bg-emerald-50 text-emerald-800',
          sizeClasses
        )}
      >
        <CheckCircle2 className="text-emerald-600" />
        <span>AI{'\u00A0'}Verified</span>
        {showScore && score ? (
          <span className="rounded bg-emerald-100 px-1 font-semibold tabular-nums">{score}</span>
        ) : null}
      </Badge>
    )
  }

  if (isPending) {
    return (
      <Badge
        variant="outline"
        className={cn('flex-nowrap border-amber-200 bg-amber-50 text-amber-800', sizeClasses)}
      >
        <Loader2 className="animate-spin text-amber-600" />
        <span>Pending{'\u00A0'}Review</span>
      </Badge>
    )
  }

  return (
    <Badge
      variant="outline"
      title="Unverified"
      className={cn('flex-nowrap border-slate-200 bg-slate-50 text-slate-600', sizeClasses)}
    >
      <AlertTriangle className="text-slate-400" />
      <span>Unverified</span>
    </Badge>
  )
}
