import { Request, Response } from 'express'

import Booking from '../models/Booking'
import Payment from '../models/Payment'
import { nextNumber } from '../models/Counter'
import { catchAsync } from '../utils/catchAsync'
import { mongooseIdValidator } from '../utils/validateFeilds'
import { sendMail } from '../utils/mailService'
import { sendPushToUser } from '../utils/pushService'
import { rewardReferralOnBooking } from '../utils/referral'
import {
  advanceByFrequency,
  daysOverdue,
  formatDueDate,
  NEW_BOOKING_FREQUENCIES,
  PAYMENT_FREQUENCIES,
  periodLabelFor,
  toUtcMidnight,
  todayIST,
  type PaymentFrequency,
} from '../utils/paymentSchedule'
import { audit } from '../utils/audit'

const mentorFullName = (mentor: any): string =>
  `${mentor?.firstName ?? ''} ${mentor?.lastName ?? ''}`.trim() || 'your mentor'

/** Class + subjects one-liner for the mentor email. */
const bookingDetail = (booking: any): string => {
  const cls = booking.selectedClass?.class_id?.class ?? ''
  const syllabus = booking.selectedSyllabus ?? ''
  const subjects = (booking.selectedSubjects ?? []).join(', ')
  return (
    [cls && syllabus ? `${cls} · ${syllabus}` : cls || syllabus, subjects]
      .filter(Boolean)
      .join(' — ') || 'New booking'
  )
}

/**
 * PATCH /api/booking/:bookingId/approve  (ADMIN)
 * Admin approval — first gate of the SRD state machine. The booking moves
 * pending → approved and is handed to the TEACHER, who must accept before
 * classes (and billing) start. The payment schedule is set up at
 * teacher-accept, not here.
 */
export const approveBookingController = catchAsync(
  async (req: Request, res: Response) => {
    const { bookingId } = req.params
    if (!mongooseIdValidator(bookingId)) {
      return res.status(400).json({ message: 'Invalid bookingId' })
    }

    const booking = await Booking.findById(bookingId).populate(
      'mentorId',
      'firstName lastName email'
    )
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }
    if (booking.bookingStatus !== 'pending') {
      return res
        .status(409)
        .json({ message: 'Only pending bookings can be approved.' })
    }

    // Optional admin overrides at approval time. (Express 5 leaves req.body
    // undefined when no JSON body was sent.) 'daily' is allowed only for
    // legacy-flat bookings — new metered bookings follow the SRD frequencies.
    const body = req.body ?? {}
    if (body.paymentFrequency !== undefined) {
      const allowed =
        booking.billingMode === 'legacy-flat'
          ? PAYMENT_FREQUENCIES
          : NEW_BOOKING_FREQUENCIES
      if (!allowed.includes(body.paymentFrequency)) {
        return res.status(400).json({
          message: 'paymentFrequency must be per-session, weekly or monthly',
        })
      }
      booking.paymentFrequency = body.paymentFrequency
    }
    if (body.classStartDate !== undefined) {
      const parsed = new Date(body.classStartDate)
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ message: 'Invalid classStartDate' })
      }
      booking.classStartDate = toUtcMidnight(parsed)
    }

    booking.bookingStatus = 'approved'
    booking.approvedAt = new Date()
    await booking.save()

    audit({
      entityType: 'booking',
      entityId: booking._id,
      action: 'admin_approve',
      actorId: (req as any).user?._id,
      actorRole: 'ADMIN',
    })

    // ---- Notify (best-effort; never fail the approval) ----
    const mentor: any = booking.mentorId
    const mentorName = mentorFullName(mentor)
    const freqLabel =
      booking.paymentFrequency === 'per-session'
        ? 'Per session'
        : booking.paymentFrequency === 'weekly'
          ? 'Weekly'
          : booking.paymentFrequency === 'daily'
            ? 'Daily'
            : 'Monthly'

    if (mentor?.email) {
      sendMail(mentor.email, 'A student is waiting for you — Scholar Hub', 'teacherAcceptRequest', {
        mentorName,
        studentName: booking.studentName,
        detail: bookingDetail(booking),
        frequency: freqLabel,
      }).catch(err => console.error('[mail] approve mentor failed:', err.message))
    }
    sendMail(booking.email, 'Your booking was approved — Scholar Hub', 'bookingAwaitingTeacher', {
      studentName: booking.studentName,
      mentorName,
    }).catch(err => console.error('[mail] approve student failed:', err.message))

    const idStr = booking._id.toString()
    sendPushToUser(mentor?._id?.toString() ?? '', {
      title: 'New booking to accept',
      body: `${booking.studentName}'s booking is approved — please accept or decline.`,
      data: { type: 'teacher_accept_request', bookingId: idStr },
    }).catch(err => console.error('[push] approve mentor failed:', err.message))
    sendPushToUser(booking.studentId?.toString() ?? '', {
      title: 'Booking approved',
      body: `Approved! We're waiting for ${mentorName} to accept your booking.`,
      data: { type: 'booking_approved', bookingId: idStr },
    }).catch(err => console.error('[push] approve student failed:', err.message))

    return res.status(200).json({ message: 'Booking approved — awaiting teacher acceptance', booking })
  }
)

/**
 * PATCH /api/booking/:bookingId/reject  (ADMIN)
 * Declines a pending booking: cancels it, frees any reserved slot seats and
 * notifies the student (with the reason, when given).
 */
export const rejectBookingController = catchAsync(
  async (req: Request, res: Response) => {
    const { bookingId } = req.params
    if (!mongooseIdValidator(bookingId)) {
      return res.status(400).json({ message: 'Invalid bookingId' })
    }

    const booking = await Booking.findById(bookingId).populate(
      'mentorId',
      'firstName lastName'
    )
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }
    if (booking.bookingStatus !== 'pending') {
      return res
        .status(409)
        .json({ message: 'Only pending bookings can be rejected.' })
    }

    const reason =
      typeof req.body?.reason === 'string' ? req.body.reason.trim() : ''

    booking.bookingStatus = 'cancelled'
    booking.paymentStatus = 'cancelled'
    booking.rejectionReason = reason
    booking.nextDueDate = null
    // Free any held seats (same as cancel): nulling claimKey releases the
    // 1-on-1 unique index so the slot can be booked again.
    if (booking.reservedSlots?.length) {
      booking.reservedSlots.forEach((s: any) => {
        s.claimKey = null
      })
    }
    await booking.save()

    const mentorName = mentorFullName(booking.mentorId)
    sendMail(booking.email, 'Update on your booking request — Scholar Hub', 'bookingRejected', {
      studentName: booking.studentName,
      mentorName,
      reason: reason || undefined,
    }).catch(err => console.error('[mail] reject student failed:', err.message))

    sendPushToUser(booking.studentId?.toString() ?? '', {
      title: 'Booking update',
      body: reason
        ? `Your booking with ${mentorName} couldn't be confirmed: ${reason}`
        : `Your booking with ${mentorName} couldn't be confirmed.`,
      data: { type: 'booking_rejected', bookingId: booking._id.toString() },
    }).catch(err => console.error('[push] reject student failed:', err.message))

    return res.status(200).json({ message: 'Booking rejected', booking })
  }
)

/**
 * POST /api/booking/:bookingId/payments  (ADMIN)
 * Records a manually collected payment and advances the next due date by one
 * period. The first recorded payment triggers the referral reward (this is
 * the manual-collection equivalent of "first completed booking").
 */
export const recordPaymentController = catchAsync(
  async (req: Request, res: Response) => {
    const { bookingId } = req.params
    if (!mongooseIdValidator(bookingId)) {
      return res.status(400).json({ message: 'Invalid bookingId' })
    }

    const booking = await Booking.findById(bookingId)
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }
    if (booking.bookingStatus === 'pending') {
      return res
        .status(409)
        .json({ message: 'Approve the booking before recording payments.' })
    }
    if (booking.bookingStatus === 'approved') {
      return res.status(409).json({
        message: 'The teacher has not accepted this booking yet.',
      })
    }
    if (booking.bookingStatus === 'cancelled') {
      return res
        .status(409)
        .json({ message: 'This booking is cancelled.' })
    }
    // Metered (billing v2) bookings are paid against their invoices — this
    // endpoint only serves pre-rework legacy-flat bookings.
    if (booking.billingMode === 'metered') {
      return res.status(409).json({
        message:
          'This booking uses invoice billing. Record the payment against its invoice instead.',
      })
    }

    const body = req.body ?? {}
    const amount = Number(body.amount ?? booking.totalAmount)
    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ message: 'Invalid amount' })
    }

    const freq: PaymentFrequency =
      (booking.paymentFrequency as PaymentFrequency) || 'monthly'
    // The due being settled; a booking approved before this feature may have
    // no nextDueDate — treat the collection as covering today.
    const dueBeingPaid = booking.nextDueDate
      ? toUtcMidnight(booking.nextDueDate)
      : todayIST()
    const isFirstPayment = (booking.payments?.length ?? 0) === 0

    const collectedAt = body.collectedAt ? new Date(body.collectedAt) : new Date()
    const note = typeof body.note === 'string' ? body.note.trim() : ''
    const periodLabel = periodLabelFor(dueBeingPaid, freq)

    booking.payments = booking.payments ?? []
    booking.payments.push({
      amount,
      collectedAt,
      note,
      collectedBy: (req as any).user?._id ?? null,
      periodLabel,
    })
    // Each mark-paid settles exactly one period; if several periods are
    // overdue the admin taps once per period collected.
    booking.nextDueDate = advanceByFrequency(dueBeingPaid, freq)
    booking.lastReminderAt = null // re-arm reminders for the new due date
    await booking.save()

    if (isFirstPayment) {
      // First real payment pays out any pending referral (idempotent util).
      await rewardReferralOnBooking(booking.studentId?.toString())
    }

    // Ledger entry + emailed receipt (billing v2 additions — best-effort, the
    // embedded payments[] above remains the legacy source of truth).
    const receiptNumber = await nextNumber('receipt')
    const ledgerEntry = await Payment.create({
      receiptNumber,
      invoiceId: null,
      bookingId: booking._id,
      studentId: booking.studentId ?? null,
      amount,
      method: ['cash', 'upi', 'bank-transfer'].includes(body.method)
        ? body.method
        : 'other',
      collectedAt,
      collectedBy: (req as any).user?._id ?? null,
      note,
      periodLabel,
      legacy: true,
    })
    audit({
      entityType: 'payment',
      entityId: ledgerEntry._id,
      action: 'payment_record',
      actorId: (req as any).user?._id,
      actorRole: 'ADMIN',
      meta: { bookingId: String(booking._id), amount, receiptNumber },
    })
    sendMail(booking.email, `Payment receipt ${receiptNumber} — Scholar Hub`, 'paymentReceipt', {
      studentName: booking.studentName,
      mentorName: 'your mentor',
      receiptNumber,
      periodLabel,
      lineItems: [{ description: `Class fee — ${periodLabel}`, amount }],
      total: amount,
      method: String(ledgerEntry.method),
      collectedAt: formatDueDate(toUtcMidnight(collectedAt)),
    })
      .then(() => {
        ledgerEntry.receiptEmailedAt = new Date()
        return ledgerEntry.save()
      })
      .catch(err => console.error('[mail] payment receipt failed:', err.message))

    sendPushToUser(booking.studentId?.toString() ?? '', {
      title: 'Payment received',
      body: `We've recorded your payment of ₹${amount}. Thank you!`,
      data: { type: 'payment_recorded', bookingId: booking._id.toString() },
    }).catch(err => console.error('[push] payment recorded failed:', err.message))

    return res.status(200).json({ message: 'Payment recorded', booking, receiptNumber })
  }
)

/**
 * GET /api/booking/payments/due  (ADMIN)
 * Lists confirmed bookings by their next due date for the admin Payments tab.
 * Query: scope=overdue|today|upcoming|all (default all), page, limit, search.
 * Returns counts for the scope tabs plus daysOverdue/dueStatus per booking.
 */
export const getDuePaymentsController = catchAsync(
  async (req: Request, res: Response) => {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1)
    const limit = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20)
    )
    const scope = String(req.query.scope ?? 'all')
    const search = String(req.query.search ?? '').trim()

    const t = todayIST()
    const tomorrow = new Date(t.getTime() + 86_400_000)

    // Legacy-flat bookings only: metered bookings also carry a nextDueDate
    // (their invoice boundary) but are collected via the Invoices tab.
    const base: Record<string, any> = {
      bookingStatus: 'confirmed',
      nextDueDate: { $ne: null },
      billingMode: { $ne: 'metered' },
    }
    if (search) {
      // Server-side search on denormalized fields so pagination stays correct.
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      base.$or = [{ studentName: rx }, { email: rx }, { phone: rx }]
    }

    const scoped = { ...base }
    if (scope === 'overdue') {
      scoped.nextDueDate = { $ne: null, $lt: t }
    } else if (scope === 'today') {
      scoped.nextDueDate = { $gte: t, $lt: tomorrow }
    } else if (scope === 'upcoming') {
      scoped.nextDueDate = { $gte: tomorrow }
    }

    const [bookings, total, overdueCount, todayCount, upcomingCount] =
      await Promise.all([
        Booking.find(scoped)
          .sort({ nextDueDate: 1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('studentId', 'firstName email phone')
          .populate('mentorId', 'firstName lastName email'),
        Booking.countDocuments(scoped),
        Booking.countDocuments({ ...base, nextDueDate: { $ne: null, $lt: t } }),
        Booking.countDocuments({ ...base, nextDueDate: { $gte: t, $lt: tomorrow } }),
        Booking.countDocuments({ ...base, nextDueDate: { $gte: tomorrow } }),
      ])

    const items = bookings.map(b => {
      const due = toUtcMidnight(b.nextDueDate as Date)
      const overdueDays = daysOverdue(due, t)
      const dueStatus =
        overdueDays > 0 ? 'overdue' : due.getTime() === t.getTime() ? 'today' : 'upcoming'
      return { ...b.toObject(), daysOverdue: overdueDays, dueStatus }
    })

    return res.status(200).json({
      message: 'Due payments fetched successfully',
      bookings: items,
      counts: { overdue: overdueCount, today: todayCount, upcoming: upcomingCount },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit,
      },
    })
  }
)
