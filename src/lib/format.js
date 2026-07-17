export const inr = (n) =>
  n == null
    ? '—'
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)

export const num = (n, d = 2) =>
  n == null ? '—' : new Intl.NumberFormat('en-IN', { minimumFractionDigits: d, maximumFractionDigits: d }).format(n)

export const units = (n) => num(n, 4)

export const pct = (n) => (n == null ? '—' : `${num(n, 2)}%`)

export const date = (s) =>
  s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export const datetime = (s) =>
  s
    ? new Date(s).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : '—'

export const humanize = (s) =>
  s ? s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : '—'

export const initials = (name) =>
  name.split(' ').filter(Boolean).map((x) => x[0]).slice(0, 2).join('').toUpperCase()

const GREEN = new Set([
  'ACTIVE', 'COMPLIANT', 'ALLOTTED', 'PUBLISHED', 'PAID', 'PROCESSED',
  'REINVESTED', 'DISBURSED', 'ACCRUED', 'COMPLETED',
])
const AMBER = new Set([
  'PENDING', 'RECEIVED', 'PROVISIONAL', 'COMPUTED', 'DECLARED', 'NFO_OPEN', 'PAUSED',
])
const BLUE = new Set(['ACCEPTED', 'APPROVED', 'REVISED'])
const RED = new Set([
  'REJECTED', 'REVERSED', 'NON_COMPLIANT', 'EXPIRED', 'CANCELLED', 'SUSPENDED',
  'FAILED', 'DEREGISTERED', 'FROZEN', 'CLOSED', 'WOUND_UP', 'INACTIVE',
])

export function statusColor(status) {
  if (!status) return 'gray'
  if (GREEN.has(status)) return 'green'
  if (AMBER.has(status)) return 'amber'
  if (BLUE.has(status)) return 'blue'
  if (RED.has(status)) return 'red'
  return 'gray'
}
