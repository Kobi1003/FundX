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
