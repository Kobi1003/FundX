export default function PageContainer({ title, children }) {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      {title ? <h1 className="mb-4 text-2xl font-semibold text-[var(--brand)]">{title}</h1> : null}
      {children}
    </div>
  )
}
