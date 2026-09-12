/** INR presentation helpers. Calculations stay in raw INR on the backend. */

export function formatINR(amount, { digits = 2 } = {}) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '—'
  const n = Number(amount)
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 10_000_000) {
    return `${sign}₹${(abs / 10_000_000).toFixed(digits)} Cr`
  }
  if (abs >= 100_000) {
    return `${sign}₹${(abs / 100_000).toFixed(digits)} L`
  }
  return `${sign}₹${abs.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export function formatINRFull(amount) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '—'
  return `₹${Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

export function formatPct(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return `${(Number(value) * 100).toFixed(digits)}%`
}

export function formatCustomers(n) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return '—'
  return Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

export function formatCurrency(amount, currency = 'USD') {
  if (amount === null || amount === undefined || isNaN(amount)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPercent(value) {
  if (value === null || value === undefined || isNaN(value)) return '—'
  return `${(value * 100).toFixed(1)}%`
}

export function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US').format(value)
}
