/**
 * Pure date math for the manual payment-collection schedule. All due dates are
 * calendar dates stored as UTC midnight (same convention as reservedSlots.date);
 * "today" is the IST calendar day (the business runs in India, servers on UTC).
 */

export type PaymentFrequency = 'daily' | 'weekly' | 'monthly'

export const PAYMENT_FREQUENCIES: PaymentFrequency[] = [
  'daily',
  'weekly',
  'monthly',
]

/** UTC-midnight of the given date's UTC calendar day. */
export const toUtcMidnight = (d: Date): Date =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000 // UTC+05:30, no DST

/** UTC-midnight of *today in IST* (Asia/Kolkata). */
export const todayIST = (now: Date = new Date()): Date =>
  toUtcMidnight(new Date(now.getTime() + IST_OFFSET_MS))

/**
 * Advance a UTC-midnight date by one payment period.
 * Monthly clamps to the last day of the target month (Jan 31 → Feb 28/29,
 * Mar 31 → Apr 30) via `Date.UTC(y, m+2, 0)` (day 0 of m+2 = last day of m+1).
 * The resulting anchor drift (Jan 31 → Feb 28 → Mar 28) is accepted — one
 * simple field, and the admin can correct nextDueDate via the update endpoint.
 */
export const advanceByFrequency = (
  date: Date,
  freq: PaymentFrequency
): Date => {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth()
  const d = date.getUTCDate()
  if (freq === 'daily') return new Date(Date.UTC(y, m, d + 1))
  if (freq === 'weekly') return new Date(Date.UTC(y, m, d + 7))
  const lastOfTarget = new Date(Date.UTC(y, m + 2, 0)).getUTCDate()
  return new Date(Date.UTC(y, m + 1, Math.min(d, lastOfTarget)))
}

/** Whole days a due date is past `today` (both UTC midnights); 0 if not yet due. */
export const daysOverdue = (nextDueDate: Date, today: Date): number =>
  Math.max(0, Math.round((today.getTime() - nextDueDate.getTime()) / 86_400_000))

const fmt = (d: Date, opts: Intl.DateTimeFormatOptions): string =>
  new Intl.DateTimeFormat('en-IN', { timeZone: 'UTC', ...opts }).format(d)

/** Human date like "16 Aug 2026" (UTC calendar day). */
export const formatDueDate = (d: Date): string =>
  fmt(d, { day: 'numeric', month: 'short', year: 'numeric' })

/** Label for the period a payment covers, keyed off its due date. */
export const periodLabelFor = (dueDate: Date, freq: PaymentFrequency): string => {
  switch (freq) {
    case 'monthly':
      return fmt(dueDate, { month: 'short', year: 'numeric' }) // "Aug 2026"
    case 'weekly':
      return `Week of ${formatDueDate(dueDate)}`
    case 'daily':
      return formatDueDate(dueDate)
  }
}
