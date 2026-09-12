import { motion } from 'framer-motion'
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
    <motion.div
      whileHover={hover ? { y: -2, transition: { duration: 0.2, ease: 'easeOut' } } : undefined}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <ShadCard className={cn(hover && 'transition-all hover:shadow-md hover:border-slate-300/80', className)}>
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
    </motion.div>
  )
}
