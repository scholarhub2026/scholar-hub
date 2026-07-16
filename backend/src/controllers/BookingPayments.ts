import { Request, Response } from 'express'

import Booking from '../models/Booking'
import { catchAsync } from '../utils/catchAsync'
import { mongooseIdValidator } from '../utils/validateFeilds'
import { sendMail } from '../utils/mailService'
import { sendPushToUser } from '../utils/pushService'
import { rewardReferralOnBooking } from '../utils/referral'
import {
  advanceByFrequency,
  daysOverdue,
  formatDueDate,
  PAYMENT_FREQUENCIES,
  periodLabelFor,
  toUtcMidnight,
  todayIST,
  type PaymentFrequency,
} from '../utils/paymentSchedule'

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
 * Confirms a pending booking and starts its payment schedule: the first due
 * date is classStartDate + one period (fees are collected AFTER classes).
 * Notifies the student and the mentor by email + push (best-effort).
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
    // undefined when no JSON body was sent.)
    const body = req.body ?? {}
    if (body.paymentFrequency !== undefined) {
      if (!PAYMENT_FREQUENCIES.includes(body.paymentFrequency)) {
        return res
          .status(400)
          .json({ message: 'paymentFrequency must be daily, weekly or monthly' })
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

    const freq: PaymentFrequency =
      (booking.paymentFrequency as PaymentFrequency) || 'monthly'
    // createdAt fallback covers legacy bookings that never sent a start date.
    const start = toUtcMidnight(
      booking.classStartDate ?? booking.bookingDate ?? booking.createdAt ?? new Date()
    )

    booking.paymentFrequency = freq
    booking.classStartDate = start
    booking.bookingStatus = 'confirmed'
    booking.approvedAt = new Date()
    booking.nextDueDate = advanceByFrequency(start, freq) // pay AFTER first period
    await booking.save()

    // ---- Notify (best-effort; never fail the approval) ----
    const mentor: any = booking.mentorId
    const mentorName = mentorFullName(mentor)
    const startLabel = formatDueDate(start)
    const dueLabel = formatDueDate(booking.nextDueDate)

    sendMail(booking.email, 'Your booking is confirmed — Scholar Hub', 'bookingApproved', {
      studentName: booking.studentName,
      mentorName,
      amount: booking.totalAmount,
      frequency: freq,
      startDate: startLabel,
      firstDueDate: dueLabel,
    }).catch(err => console.error('[mail] approve student failed:', err.message))

    if (mentor?.email) {
      sendMail(mentor.email, 'New confirmed student — Scholar Hub', 'bookingApprovedMentor', {
        mentorName,
        studentName: booking.studentName,
        detail: bookingDetail(booking),
        startDate: startLabel,
      }).catch(err => console.error('[mail] approve mentor failed:', err.message))
    }

    const idStr = booking._id.toString()
    sendPushToUser(booking.studentId?.toString() ?? '', {
      title: 'Booking approved 🎉',
      body: `Your classes with ${mentorName} are confirmed. Starts ${startLabel}.`,
      data: { type: 'booking_approved', bookingId: idStr },
    }).catch(err => console.error('[push] approve student failed:', err.message))
    sendPushToUser(mentor?._id?.toString() ?? '', {
      title: 'New confirmed student',
      body: `${booking.studentName}'s booking is confirmed. Classes start ${startLabel}.`,
      data: { type: 'booking', bookingId: idStr },
    }).catch(err => console.error('[push] approve mentor failed:', err.message))

    return res.status(200).json({ message: 'Booking approved', booking })
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
    if (booking.bookingStatus === 'cancelled') {
      return res
        .status(409)
        .json({ message: 'This booking is cancelled.' })
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

    booking.payments = booking.payments ?? []
    booking.payments.push({
      amount,
      collectedAt: body.collectedAt ? new Date(body.collectedAt) : new Date(),
      note: typeof body.note === 'string' ? body.note.trim() : '',
      collectedBy: (req as any).user?._id ?? null,
      periodLabel: periodLabelFor(dueBeingPaid, freq),
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

    sendPushToUser(booking.studentId?.toString() ?? '', {
      title: 'Payment received',
      body: `We've recorded your payment of ₹${amount}. Thank you!`,
      data: { type: 'payment_recorded', bookingId: booking._id.toString() },
    }).catch(err => console.error('[push] payment recorded failed:', err.message))

    return res.status(200).json({ message: 'Payment recorded', booking })
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

    const base: Record<string, any> = {
      bookingStatus: 'confirmed',
      nextDueDate: { $ne: null },
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
