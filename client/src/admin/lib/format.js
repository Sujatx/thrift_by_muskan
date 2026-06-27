import { formatDistanceToNow, format } from 'date-fns'

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

/** Format a rupee amount (number) as ₹1,200. */
export function formatMoney(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return inr.format(Number(value))
}

/** Compact ₹ for stat cards: ₹48.2k */
export function formatMoneyCompact(value) {
  const n = Number(value) || 0
  if (n >= 100000) return `₹${(n / 100000).toFixed(1).replace(/\.0$/, '')}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return `₹${n}`
}

export function formatDate(value, pattern = 'dd MMM yyyy') {
  if (!value) return '—'
  try {
    return format(new Date(value), pattern)
  } catch {
    return '—'
  }
}

export function formatRelative(value) {
  if (!value) return '—'
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true })
  } catch {
    return '—'
  }
}

/** Short order reference, e.g. MBM-1a2b3 from a Mongo ObjectId. */
export function orderRef(id) {
  if (!id) return '—'
  return `MBM-${String(id).slice(-5).toUpperCase()}`
}

export const PRODUCT_CATEGORIES = ['tops', 'bottoms', 'dresses', 'accessories']

/** Maps an entity status to a Badge variant + label. */
export const PRODUCT_STATUS = {
  available: { label: 'Available', variant: 'success' },
  reserved: { label: 'Reserved', variant: 'warning' },
  sold: { label: 'Sold', variant: 'default' },
}

export const ORDER_STATUS = {
  paid: { label: 'Paid', variant: 'success' },
  pending: { label: 'Pending', variant: 'warning' },
  failed: { label: 'Failed', variant: 'danger' },
  refunded: { label: 'Refunded', variant: 'info' },
}

export const BANNER_TYPES = {
  hero_main: 'Hero — main',
  hero_secondary: 'Hero — secondary',
  promo: 'Promo',
}
