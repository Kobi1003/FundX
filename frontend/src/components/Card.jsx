export default function Card({ title, children, className = '' }) {
  return (
    <section className={`border border-black/10 bg-white/80 p-4 ${className}`}>
      {title ? <h2 className="mb-2 text-base font-semibold text-[var(--brand)]">{title}</h2> : null}
      {children}
    </section>
  )
}
