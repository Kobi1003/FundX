import PageTransition from './PageTransition'

export default function PageContainer({ title, description, action, children }) {
  return (
    <PageTransition className="w-full space-y-6 pb-8">
      {(title || action) && (
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            {title && <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>}
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          {action && <div className="flex shrink-0 items-center gap-3">{action}</div>}
        </div>
      )}
      {children}
    </PageTransition>
  )
}
