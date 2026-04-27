import type { Timestamp } from 'firebase/firestore'

export function formatDate(ts: Timestamp | string | undefined): string {
  if (!ts) return '—'
  if (typeof ts === 'string') {
    if (!ts) return '—'
    const d = new Date(ts + 'T00:00:00')
    return d.toLocaleDateString('pt-BR')
  }
  if (typeof ts === 'object' && 'toDate' in ts) {
    return (ts as Timestamp).toDate().toLocaleDateString('pt-BR')
  }
  return '—'
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function daysUntil(dateStr: string): number {
  if (!dateStr) return Infinity
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export function businessDaysSince(ts: Timestamp | undefined): number {
  if (!ts || !('toDate' in ts)) return 0
  const start = (ts as Timestamp).toDate()
  const now = new Date()
  let count = 0
  const current = new Date(start)
  while (current < now) {
    const day = current.getDay()
    if (day !== 0 && day !== 6) count++
    current.setDate(current.getDate() + 1)
  }
  return count
}
