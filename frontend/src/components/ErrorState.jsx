import { AlertTriangle } from 'lucide-react'

export default function ErrorState({ message = 'Something went wrong.' }) {
  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-rose-300"
      role="alert"
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
      <div>
        <p className="text-sm font-semibold">Service Notice</p>
        <p className="mt-0.5 text-xs text-rose-300/90">{message}</p>
      </div>
    </div>
  )
}
