import { cn } from '@/lib/utils'

export function BentoGrid({ className, children }) {
  return (
    <div className={cn('grid auto-rows-min grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12', className)}>
      {children}
    </div>
  )
}

export function BentoItem({ className, children }) {
  return <div className={cn('min-w-0', className)}>{children}</div>
}
