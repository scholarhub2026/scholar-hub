import { Request, Response } from 'express'

import Booking from '../models/Booking'
import Invoice from '../models/Invoice'
import { audit } from '../utils/audit'
import { catchAsync } from '../utils/catchAsync'
import { generateInvoiceForBooking } from '../utils/invoiceService'
import { sendMail } from '../utils/mailService'
import { sendPushToRole, sendPushToUser } from '../utils/pushService'
import {
  advanceByFrequency,
  formatDueDate,
  toUtcMidnight,
  type PaymentFrequency,
} from '../utils/paymentSchedule'
import { PricingError, estimateBaseAmount } from '../utils/pricingEngine'
import { resolveRatesForBooking } from '../utils/rateResolution'
import { mongooseIdValidator } from '../utils/validateFeilds'

const mentorFullName = (mentor: any): string =>
  `${mentor?.firstName ?? ''} ${mentor?.lastName ?? ''}`.trim() || 'your mentor'

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

/** Human billing line for the confirmation email. */
const billingLineFor = (booking: any): string => {
  const freq = booking.paymentFrequency || 'monthly'
  const cadence =
    freq === 'per-session'
      ? 'invoiced per session'
      : freq === 'weekly'
        ? 'invoiced weekly'
        : 'invoiced monthly'
  if (booking.billingMode !== 'metered') {
    return `₹${booking.totalAmount} per ${freq === 'weekly' ? 'week' : freq === 'daily' ? 'day' : 'month'}`
  }
  const snap = booking.pricingSnapshot
  if (booking.bookingType === 'full' && snap?.perClassFee != null) {
    return `₹${snap.perClassFee} per class, ${cadence}`
  }
  const rates = (snap?.subjectRates ?? [])
    .map((r: any) => (r.name ? `${r.name} ₹${r.hourlyRate}/hr` : `₹${r.hourlyRate}/hr`))
    .join(', ')
  return rates ? `${rates} — ${cadence}` : `Hourly, ${cadence}`
}

/**
 * PATCH /api/booking/:bookingId/teacher-accept  (TUTOR — the booked mentor)
 * The teacher accepts an admin-approved booking: rates are resolved and FROZEN
 * onto the booking (pricingSnapshot), the billing cycle starts and everyone is
 * notified. approved → confirmed.
 */
export const teacherAcceptController = catchAsync(
  async (req: Request, res: Response) => {
    const { bookingId } = req.params
    if (!mongooseIdValidator(bookingId)) {
      return res.status(400).json({ message: 'Invalid bookingId' })
    }

    const booking: any = await Booking.findById(bookingId).populate(
      'mentorId',
      'firstName lastName email'
    )
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }
    const mentorIdStr = String(booking.mentorId?._id ?? booking.mentorId)
    if (mentorIdStr !== String((req as any).user?._id)) {
      return res
        .status(403)
        .json({ message: 'Only the booked mentor can accept this booking.' })
    }
    if (booking.bookingStatus !== 'approved') {
      return res
        .status(409)
        .json({ message: 'Only admin-approved bookings can be accepted.' })
    }

    const freq: PaymentFrequency =
      (booking.paymentFrequency as PaymentFrequency) || 'monthly'
    const start = toUtcMidnight(
      booking.classStartDate ?? booking.bookingDate ?? booking.createdAt ?? new Date()
    )

    // Freeze the rate card (metered bookings). Legacy-flat bookings keep their
    // flat per-period totalAmount and skip the snapshot.
    if (booking.billingMode === 'metered') {
      const classId =
        booking.selectedClass?.class_id?._id ?? booking.selectedClass?.class_id
      try {
        const { rateCard } = await resolveRatesForBooking({
          mentorId: mentorIdStr,
          classId: String(classId),
          bookingType: booking.bookingType,
          selectedSubjectIds: (booking.selectedSubjects ?? []).map(String),
        })
        booking.pricingSnapshot = {
          source: rateCard.source,
          perClassFee: rateCard.perClassFee,
          subjectRates: rateCard.subjectRates.map((r) => ({
            subject_id: r.subjectId,
            name: r.name,
            hourlyRate: r.hourlyRate,
          })),
          snapshottedAt: new Date(),
        }
        booking.totalAmount = estimateBaseAmount(booking.bookingType, rateCard)
      } catch (err) {
        if (err instanceof PricingError) {
          return res.status(422).json({
            message: `Fees are not configured for this booking: ${err.message}`,
            code: err.code,
          })
        }
        throw err
      }
    }

    booking.classStartDate = start
    booking.bookingStatus = 'confirmed'
    booking.teacherAcceptedAt = new Date()
    // Weekly/monthly cycles bill at start + one period (pay AFTER classes);
    // per-session bookings invoice at session verification instead.
    booking.nextDueDate =
      freq === 'per-session' ? null : advanceByFrequency(start, freq)
    await booking.save()

    audit({
      entityType: 'booking',
      entityId: booking._id,
      action: 'teacher_accept',
      actorId: (req as any).user?._id,
      actorRole: 'TUTOR',
    })

    // ---- Notify (best-effort) ----
    const mentorName = mentorFullName(booking.mentorId)
    const startLabel = formatDueDate(start)

    sendMail(booking.email, 'Your booking is confirmed — Scholar Hub', 'teacherAccepted', {
      studentName: booking.studentName,
      mentorName,
      detail: bookingDetail(booking),
      startDate: startLabel,
      billingLine: billingLineFor(booking),
    }).catch(err => console.error('[mail] teacher accept student failed:', err.message))

    const idStr = booking._id.toString()
    sendPushToUser(String(booking.studentId ?? ''), {
      title: 'Booking confirmed 🎉',
      body: `${mentorName} accepted your booking. Classes start ${startLabel}.`,
      data: { type: 'booking_confirmed', bookingId: idStr },
    }).catch(err => console.error('[push] teacher accept student failed:', err.message))
    sendPushToRole('ADMIN', {
      title: 'Teacher accepted a booking',
      body: `${mentorName} accepted ${booking.studentName}'s booking.`,
      data: { type: 'booking_confirmed', bookingId: idStr },
    }).catch(err => console.error('[push] teacher accept admin failed:', err.message))

    return res.status(200).json({ message: 'Booking accepted', booking })
  }
)

/**
 * PATCH /api/booking/:bookingId/teacher-decline  (TUTOR — the booked mentor)
 * The teacher declines an approved booking: it is cancelled, reserved seats
 * are freed and the student + admins are notified (with the reason if given).
 */
export const teacherDeclineController = catchAsync(
  async (req: Request, res: Response) => {
    const { bookingId } = req.params
    if (!mongooseIdValidator(bookingId)) {
      return res.status(400).json({ message: 'Invalid bookingId' })
    }

    const booking: any = await Booking.findById(bookingId).populate(
      'mentorId',
      'firstName lastName'
    )
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }
    const mentorIdStr = String(booking.mentorId?._id ?? booking.mentorId)
    if (mentorIdStr !== String((req as any).user?._id)) {
      return res
        .status(403)
        .json({ message: 'Only the booked mentor can decline this booking.' })
    }
    if (booking.bookingStatus !== 'approved') {
      return res
        .status(409)
        .json({ message: 'Only admin-approved bookings can be declined.' })
    }

    const reason =
      typeof req.body?.reason === 'string' ? req.body.reason.trim() : ''

    booking.bookingStatus = 'cancelled'
    booking.paymentStatus = 'cancelled'
    booking.teacherDeclineReason = reason
    booking.nextDueDate = null
    // Free any held seats so the slots reopen (same as reject/cancel).
    if (booking.reservedSlots?.length) {
      booking.reservedSlots.forEach((s: any) => {
        s.claimKey = null
      })
    }
    await booking.save()

    audit({
      entityType: 'booking',
      entityId: booking._id,
      action: 'teacher_decline',
      actorId: (req as any).user?._id,
      actorRole: 'TUTOR',
      meta: reason ? { reason } : undefined,
    })

    const mentorName = mentorFullName(booking.mentorId)
    sendMail(booking.email, 'Update on your booking request — Scholar Hub', 'teacherDeclined', {
      studentName: booking.studentName,
      mentorName,
      reason: reason || undefined,
    }).catch(err => console.error('[mail] teacher decline student failed:', err.message))

    const idStr = booking._id.toString()
    sendPushToUser(String(booking.studentId ?? ''), {
      title: 'Booking update',
      body: reason
        ? `${mentorName} couldn't take your booking: ${reason}`
        : `${mentorName} couldn't take your booking.`,
      data: { type: 'booking_declined', bookingId: idStr },
    }).catch(err => console.error('[push] teacher decline student failed:', err.message))
    sendPushToRole('ADMIN', {
      title: 'Teacher declined a booking',
      body: `${mentorName} declined ${booking.studentName}'s booking.`,
      data: { type: 'booking_declined', bookingId: idStr },
    }).catch(err => console.error('[push] teacher decline admin failed:', err.message))

    return res.status(200).json({ message: 'Booking declined', booking })
  }
)

/**
 * GET /api/booking/mentor/requests  (TUTOR)
 * The mentor's pending accept/decline queue: admin-approved bookings waiting
 * on this mentor.
 */
export const getMentorRequestsController = catchAsync(
  async (req: Request, res: Response) => {
    const mentorId = (req as any).user?._id
    const bookings = await Booking.find({
      mentorId,
      bookingStatus: 'approved',
    })
      .sort({ approvedAt: -1 })
      .populate('studentId', 'firstName email phone')

    return res.status(200).json({
      message: 'Booking requests fetched successfully',
      bookings,
    })
  }
)

/**
 * PATCH /api/booking/:bookingId/complete  (ADMIN)
 * Classes are over: stops session logging and raises the final invoice for
 * whatever verified sessions are still unbilled. confirmed → completed.
 */
export const completeBookingController = catchAsync(
  async (req: Request, res: Response) => {
    const { bookingId } = req.params
    if (!mongooseIdValidator(bookingId)) {
      return res.status(400).json({ message: 'Invalid bookingId' })
    }

    const booking = await Booking.findById(bookingId)
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }
    if (booking.bookingStatus !== 'confirmed') {
      return res
        .status(409)
        .json({ message: 'Only confirmed bookings can be completed.' })
    }

    booking.bookingStatus = 'completed'
    await booking.save()

    // Final partial-period invoice (metered only; no-op for legacy-flat).
    let finalInvoice: unknown = null
    if (booking.billingMode === 'metered') {
      const result = await generateInvoiceForBooking(String(booking._id), {
        generatedBy: String((req as any).user?._id ?? 'admin'),
        finalize: true,
      })
      if (result.outcome === 'generated') finalInvoice = result.invoice
    }

    audit({
      entityType: 'booking',
      entityId: booking._id,
      action: 'booking_complete',
      actorId: (req as any).user?._id,
      actorRole: 'ADMIN',
    })

    return res
      .status(200)
      .json({ message: 'Booking completed', booking, finalInvoice })
  }
)

/**
 * PATCH /api/booking/:bookingId/close  (ADMIN)
 * Terminal state — only allowed once every invoice is settled (or void).
 */
export const closeBookingController = catchAsync(
  async (req: Request, res: Response) => {
    const { bookingId } = req.params
    if (!mongooseIdValidator(bookingId)) {
      return res.status(400).json({ message: 'Invalid bookingId' })
    }

    const booking = await Booking.findById(bookingId)
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }
    if (booking.bookingStatus !== 'completed') {
      return res
        .status(409)
        .json({ message: 'Only completed bookings can be closed.' })
    }

    const openInvoices = await Invoice.countDocuments({
      bookingId: booking._id,
      status: { $in: ['payment_due', 'paid'] },
    })
    if (openInvoices > 0) {
      return res.status(409).json({
        message: `Cannot close: ${openInvoices} invoice(s) still unpaid or unsettled.`,
      })
    }

    booking.bookingStatus = 'closed'
    booking.nextDueDate = null
    await booking.save()

    audit({
      entityType: 'booking',
      entityId: booking._id,
      action: 'booking_close',
      actorId: (req as any).user?._id,
      actorRole: 'ADMIN',
    })

    return res.status(200).json({ message: 'Booking closed', booking })
  }
)
