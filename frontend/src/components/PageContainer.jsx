export default function PageContainer({ title, description, action, children }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
      {(title || action) && (
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            {title && (
              <h1 className="text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-1 text-sm text-slate-400">{description}</p>
            )}
          </div>
          {action && <div className="flex shrink-0 items-center gap-3">{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
