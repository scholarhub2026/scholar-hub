import Booking from '../models/Booking'
import Invoice from '../models/Invoice'
import Session from '../models/Session'
import { nextNumber } from '../models/Counter'
import { audit } from './audit'
import { sendMail } from './mailService'
import { sendPushToUser } from './pushService'
import {
  advanceByFrequency,
  formatDueDate,
  periodLabelFor,
  todayIST,
  toUtcMidnight,
  type PaymentFrequency,
} from './paymentSchedule'
import { computeInvoice, type RateCard } from './pricingEngine'

/** The booking's frozen rate card (written at teacher-accept). */
export const rateCardFromSnapshot = (booking: any): RateCard | null => {
  const snap = booking.pricingSnapshot
  if (!snap) return null
  return {
    source: snap.source,
    perClassFee: snap.perClassFee ?? null,
    subjectRates: (snap.subjectRates ?? []).map((r: any) => ({
      subjectId: r.subject_id ? String(r.subject_id) : null,
      name: r.name ?? '',
      hourlyRate: r.hourlyRate,
    })),
  }
}

/** UTC-midnight one period BEFORE the given boundary (weekly/monthly). */
const retreatByFrequency = (date: Date, freq: PaymentFrequency): Date => {
  const y = date.getUTCFullYear()
  const m = date.getUTCMonth()
  const d = date.getUTCDate()
  if (freq === 'weekly') return new Date(Date.UTC(y, m, d - 7))
  if (freq === 'daily') return new Date(Date.UTC(y, m, d - 1))
  // monthly: clamp to last day of the previous month (mirror of advance).
  const lastOfPrev = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return new Date(Date.UTC(y, m - 1, Math.min(d, lastOfPrev)))
}

const dateKey = (d: Date): string => d.toISOString().slice(0, 10)

const mentorNameOf = (mentor: any): string =>
  `${mentor?.firstName ?? ''} ${mentor?.lastName ?? ''}`.trim() || 'your mentor'

/** Best-effort "invoice raised" student notice (mail + push). */
const notifyInvoice = (booking: any, invoice: any) => {
  const mentorName = mentorNameOf(booking.mentorId)
  sendMail(
    booking.email,
    `Your class fee for ${invoice.periodLabel} — Scholar Hub`,
    'invoiceGenerated',
    {
      studentName: booking.studentName,
      mentorName,
      invoiceNumber: invoice.invoiceNumber,
      periodLabel: invoice.periodLabel ?? '',
      lineItems: invoice.lineItems.map((li: any) => ({
        description: li.description,
        amount: li.amount,
      })),
      total: invoice.amount,
    }
  ).catch((err) => console.error('[mail] invoice notice failed:', err.message))

  sendPushToUser(String(booking.studentId?._id ?? booking.studentId ?? ''), {
    title: 'Class fee due',
    body: `₹${invoice.amount} due for ${invoice.periodLabel} (${invoice.invoiceNumber}).`,
    data: { type: 'invoice_generated', bookingId: String(booking._id), invoiceId: String(invoice._id) },
  }).catch((err) => console.error('[push] invoice notice failed:', err.message))
}

export type GenerateResult =
  | { outcome: 'generated'; invoice: any }
  | { outcome: 'empty-period' } // no billable sessions — boundary advanced only
  | { outcome: 'duplicate' } // another worker already generated this period
  | { outcome: 'skipped'; reason: string }

/**
 * Generate the invoice for a metered weekly/monthly booking's current cycle
 * (periodEnd = booking.nextDueDate) and advance the boundary. Bills every
 * verified, unbilled session dated before periodEnd. `finalize` (booking
 * completed) bills everything regardless of boundary and stops the cycle.
 * Race-safe without transactions via the unique Invoice.periodKey index.
 */
export const generateInvoiceForBooking = async (
  bookingId: string,
  opts: { generatedBy?: string; finalize?: boolean } = {}
): Promise<GenerateResult> => {
  const booking: any = await Booking.findById(bookingId)
    .populate('mentorId', 'firstName lastName email')
    .populate('studentId', 'firstName email')
  if (!booking) return { outcome: 'skipped', reason: 'Booking not found' }
  if (booking.billingMode !== 'metered') {
    return { outcome: 'skipped', reason: 'Not a metered booking' }
  }
  const rateCard = rateCardFromSnapshot(booking)
  if (!rateCard) {
    return { outcome: 'skipped', reason: 'Booking has no pricing snapshot' }
  }

  const freq: PaymentFrequency =
    (booking.paymentFrequency as PaymentFrequency) || 'monthly'
  const finalize = Boolean(opts.finalize)
  if (freq === 'per-session' && !finalize) {
    return { outcome: 'skipped', reason: 'Per-session bookings invoice at verify' }
  }

  // Period bounds. On finalize there may be no nextDueDate cycle — bill
  // everything outstanding "up to today".
  const boundary: Date | null = booking.nextDueDate
    ? toUtcMidnight(booking.nextDueDate)
    : null
  const periodEnd = finalize || !boundary ? todayIST() : boundary
  const cycleFreq: PaymentFrequency = freq === 'per-session' ? 'daily' : freq
  const periodStart = boundary
    ? retreatByFrequency(boundary, cycleFreq)
    : toUtcMidnight(booking.classStartDate ?? booking.createdAt ?? new Date())

  const sessionFilter: Record<string, unknown> = {
    bookingId: booking._id,
    status: 'verified',
    invoiceId: null,
  }
  if (!finalize) sessionFilter.date = { $lt: periodEnd }
  const sessions = await Session.find(sessionFilter).sort({ date: 1 })

  if (!sessions.length) {
    // Nothing billable this cycle — just advance the boundary (audited).
    if (!finalize && boundary) {
      booking.nextDueDate = advanceByFrequency(boundary, freq)
      await booking.save()
      audit({
        entityType: 'booking',
        entityId: booking._id,
        action: 'invoice_cycle_empty',
        meta: { periodEnd: dateKey(periodEnd) },
      })
    } else if (finalize && boundary) {
      booking.nextDueDate = null
      await booking.save()
    }
    return { outcome: 'empty-period' }
  }

  const { lineItems, total } = computeInvoice({
    bookingType: booking.bookingType,
    rateCard,
    sessions: sessions.map((s: any) => ({
      _id: String(s._id),
      durationMinutes: s.durationMinutes,
      subjectId: s.subjectId ? String(s.subjectId) : null,
    })),
  })

  const invoiceNumber = await nextNumber('invoice')
  let invoice: any
  try {
    invoice = await Invoice.create({
      invoiceNumber,
      bookingId: booking._id,
      studentId: booking.studentId?._id ?? booking.studentId,
      mentorId: booking.mentorId?._id ?? booking.mentorId,
      studentName: booking.studentName,
      email: booking.email,
      mentorName: mentorNameOf(booking.mentorId),
      bookingType: booking.bookingType,
      paymentFrequency: freq,
      periodStart,
      periodEnd,
      periodLabel: periodLabelFor(periodEnd, freq),
      lineItems,
      amount: total,
      periodKey: `${booking._id}|${dateKey(periodStart)}${finalize ? '|final' : ''}`,
      generatedBy: opts.generatedBy ?? 'cron',
    })
  } catch (err: unknown) {
    if ((err as { code?: number })?.code === 11000) {
      return { outcome: 'duplicate' }
    }
    throw err
  }

  // Lock the billed sessions to this invoice (filter keeps it idempotent).
  await Session.updateMany(
    { _id: { $in: sessions.map((s) => s._id) }, invoiceId: null },
    { $set: { invoiceId: invoice._id } }
  )

  // Move the cycle forward (or stop it on finalize).
  booking.nextDueDate =
    finalize || !boundary ? null : advanceByFrequency(boundary, freq)
  booking.lastReminderAt = null
  await booking.save()

  audit({
    entityType: 'invoice',
    entityId: invoice._id,
    action: 'invoice_generated',
    meta: {
      bookingId: String(booking._id),
      amount: total,
      sessions: sessions.length,
      generatedBy: opts.generatedBy ?? 'cron',
      finalize,
    },
  })
  notifyInvoice(booking, invoice)
  return { outcome: 'generated', invoice }
}

/**
 * Per-session billing: one invoice per verified session, generated the moment
 * the admin verifies it. periodKey includes the session id so several sessions
 * on the same date each invoice exactly once.
 */
export const generateInvoiceForSession = async (
  sessionId: string,
  opts: { generatedBy?: string } = {}
): Promise<GenerateResult> => {
  const session: any = await Session.findById(sessionId)
  if (!session) return { outcome: 'skipped', reason: 'Session not found' }
  if (session.status !== 'verified') {
    return { outcome: 'skipped', reason: 'Session is not verified' }
  }
  if (session.invoiceId) return { outcome: 'duplicate' }

  const booking: any = await Booking.findById(session.bookingId)
    .populate('mentorId', 'firstName lastName email')
    .populate('studentId', 'firstName email')
  if (!booking) return { outcome: 'skipped', reason: 'Booking not found' }
  if (booking.billingMode !== 'metered' || booking.paymentFrequency !== 'per-session') {
    return { outcome: 'skipped', reason: 'Not a per-session metered booking' }
  }
  const rateCard = rateCardFromSnapshot(booking)
  if (!rateCard) {
    return { outcome: 'skipped', reason: 'Booking has no pricing snapshot' }
  }

  const { lineItems, total } = computeInvoice({
    bookingType: booking.bookingType,
    rateCard,
    sessions: [
      {
        _id: String(session._id),
        durationMinutes: session.durationMinutes,
        subjectId: session.subjectId ? String(session.subjectId) : null,
      },
    ],
  })

  const day = toUtcMidnight(session.date)
  const invoiceNumber = await nextNumber('invoice')
  let invoice: any
  try {
    invoice = await Invoice.create({
      invoiceNumber,
      bookingId: booking._id,
      studentId: booking.studentId?._id ?? booking.studentId,
      mentorId: booking.mentorId?._id ?? booking.mentorId,
      studentName: booking.studentName,
      email: booking.email,
      mentorName: mentorNameOf(booking.mentorId),
      bookingType: booking.bookingType,
      paymentFrequency: 'per-session',
      periodStart: day,
      periodEnd: day,
      periodLabel: `Session on ${formatDueDate(day)}`,
      lineItems,
      amount: total,
      periodKey: `${booking._id}|${dateKey(day)}|${session._id}`,
      generatedBy: opts.generatedBy ?? 'verify',
    })
  } catch (err: unknown) {
    if ((err as { code?: number })?.code === 11000) {
      return { outcome: 'duplicate' }
    }
    throw err
  }

  await Session.updateOne(
    { _id: session._id, invoiceId: null },
    { $set: { invoiceId: invoice._id } }
  )

  audit({
    entityType: 'invoice',
    entityId: invoice._id,
    action: 'invoice_generated',
    meta: {
      bookingId: String(booking._id),
      sessionId: String(session._id),
      amount: total,
      generatedBy: opts.generatedBy ?? 'verify',
    },
  })
  notifyInvoice(booking, invoice)
  return { outcome: 'generated', invoice }
}
