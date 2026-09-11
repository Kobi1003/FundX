import { Loader2 } from 'lucide-react'

export default function LoadingState({ label = 'Loading system data…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="relative mb-3 flex items-center justify-center">
        <div className="h-10 w-10 animate-ping rounded-full bg-emerald-500/20"></div>
        <Loader2 className="absolute h-6 w-6 animate-spin text-emerald-400" />
      </div>
      <p className="text-sm font-medium text-slate-300">{label}</p>
      <p className="mt-1 text-xs text-slate-500">Communicating with AI Investment Arena Gateway</p>
    </div>
  )
}
