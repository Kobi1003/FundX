export default function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}) {
  const styles =
    variant === 'primary'
      ? 'bg-[var(--brand)] text-white hover:opacity-90'
      : 'border border-[var(--brand)] text-[var(--brand)] hover:bg-black/5'
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition ${styles} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
