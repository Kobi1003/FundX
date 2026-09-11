export default function Card({ title, subtitle, action, children, className = '', hover = true }) {
  return (
    <section className={`glass-panel p-5 ${hover ? 'glass-panel-hover' : ''} ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div>
            {title && <h2 className="text-base font-bold tracking-tight text-slate-100">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
