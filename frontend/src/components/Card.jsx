import {
  Card as ShadCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function Card({ title, subtitle, action, children, className = '', hover = true }) {
  return (
    <ShadCard className={cn(hover && 'transition-shadow hover:shadow-md', className)}>
      {(title || action) && (
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div className="space-y-1">
            {title && <CardTitle>{title}</CardTitle>}
            {subtitle && <CardDescription>{subtitle}</CardDescription>}
          </div>
          {action ? <CardAction className="static">{action}</CardAction> : null}
        </CardHeader>
      )}
      <CardContent className={title || action ? '' : 'pt-5'}>{children}</CardContent>
    </ShadCard>
  )
}
