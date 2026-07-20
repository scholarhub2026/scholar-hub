import { Request, Response } from 'express'

import Booking from '../models/Booking'
import Session from '../models/Session'
import { audit } from '../utils/audit'
import { catchAsync } from '../utils/catchAsync'
import { generateInvoiceForSession } from '../utils/invoiceService'
import { sendPushToRole, sendPushToUser } from '../utils/pushService'
import { toUtcMidnight } from '../utils/paymentSchedule'
import { mongooseIdValidator } from '../utils/validateFeilds'

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

const minutesBetween = (start: string, end: string): number => {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh - sh) * 60 + (em - sm)
}

/** Parse "YYYY-MM-DD" (or ISO) into UTC midnight; null when invalid. */
const parseDay = (raw: unknown): Date | null => {
  if (!raw) return null
  const str = String(raw)
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(str) ? `${str}T00:00:00.000Z` : str
  const parsed = new Date(iso)
  return isNaN(parsed.getTime()) ? null : toUtcMidnight(parsed)
}

/** Validate the session time fields shared by create + update. */
const validateTimes = (
  body: any
): { date: Date; startTime: string; endTime: string } | { error: string } => {
  const date = parseDay(body.date)
  if (!date) return { error: 'A valid session date is required' }
  const startTime = String(body.startTime ?? '')
  const endTime = String(body.endTime ?? '')
  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
    return { error: 'startTime and endTime must be "HH:mm"' }
  }
  if (endTime <= startTime) {
    return { error: 'endTime must be after startTime' }
  }
  return { date, startTime, endTime }
}

/**
 * POST /api/sessions  (TUTOR)
 * The mentor logs a completed class session (SRD Sessions & Attendance).
 * Sessions are born 'logged' and must be verified by an admin before they
 * become billable.
 */
export const createSessionController = catchAsync(
  async (req: Request, res: Response) => {
    const body = req.body ?? {}
    const { bookingId } = body
    if (!bookingId || !mongooseIdValidator(bookingId)) {
      return res.status(400).json({ message: 'Valid bookingId is required' })
    }

    const booking: any = await Booking.findById(bookingId)
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }
    if (String(booking.mentorId) !== String((req as any).user?._id)) {
      return res
        .status(403)
        .json({ message: 'You can only log sessions for your own bookings.' })
    }
    if (booking.bookingStatus !== 'confirmed') {
      return res
        .status(409)
        .json({ message: 'Sessions can only be logged on confirmed bookings.' })
    }

    const times = validateTimes(body)
    if ('error' in times) {
      return res.status(400).json({ message: times.error })
    }

    // Multiple-subject bookings bill per subject — the log must say which one.
    let subjectId: string | null = null
    let subjectName = ''
    if (booking.bookingType === 'multiple') {
      subjectId = body.subjectId ? String(body.subjectId) : null
      if (!subjectId || !mongooseIdValidator(subjectId as any)) {
        return res.status(400).json({
          message: 'subjectId is required for a multiple-subject booking',
        })
      }
      const allowed = (booking.selectedSubjects ?? []).map(String)
      if (!allowed.includes(subjectId)) {
        return res.status(400).json({
          message: 'That subject is not part of this booking',
        })
      }
      subjectName =
        (booking.selectedClass?.subject ?? []).find(
          (sub: any) => String(sub.subject_id?._id ?? sub.subject_id) === subjectId
        )?.subject_id?.name ?? ''
    } else if (booking.bookingType === 'individual') {
      // Implicit: the one booked subject.
      subjectId = booking.selectedSubjects?.[0]
        ? String(booking.selectedSubjects[0])
        : null
    }

    let session
    try {
      session = await Session.create({
        bookingId: booking._id,
        mentorId: booking.mentorId,
        studentId: booking.studentId,
        date: times.date,
        startTime: times.startTime,
        endTime: times.endTime,
        durationMinutes: minutesBetween(times.startTime, times.endTime),
        subjectId,
        subjectName,
        notes: typeof body.notes === 'string' ? body.notes.trim() : '',
        status: 'logged',
        loggedBy: (req as any).user?._id ?? null,
      })
    } catch (err: unknown) {
      if ((err as { code?: number })?.code === 11000) {
        return res.status(409).json({
          message: 'A session at this date and time is already logged.',
        })
      }
      throw err
    }

    audit({
      entityType: 'session',
      entityId: session._id,
      action: 'session_log',
      actorId: (req as any).user?._id,
      actorRole: 'TUTOR',
      meta: { bookingId: String(booking._id) },
    })
    sendPushToRole('ADMIN', {
      title: 'Session logged',
      body: `A session on ${times.date.toISOString().slice(0, 10)} awaits verification.`,
      data: { type: 'session_logged', sessionId: String(session._id) },
    }).catch(err => console.error('[push] session log admin failed:', err.message))

    return res.status(201).json({ message: 'Session logged', session })
  }
)

/**
 * GET /api/sessions  (any role — role-filtered)
 * Query: bookingId, status, mentorId (admin only), page, limit.
 */
export const listSessionsController = catchAsync(
  async (req: Request, res: Response) => {
    const user = (req as any).user
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1)
    const limit = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20)
    )

    const filter: Record<string, unknown> = {}
    if (user?.role === 'TUTOR') filter.mentorId = user._id
    else if (user?.role === 'STUDENT') filter.studentId = user._id
    else if (user?.role === 'ADMIN') {
      if (req.query.mentorId && mongooseIdValidator(req.query.mentorId as any)) {
        filter.mentorId = req.query.mentorId
      }
    } else {
      return res.status(403).json({ message: 'Access denied' })
    }

    if (req.query.bookingId && mongooseIdValidator(req.query.bookingId as any)) {
      filter.bookingId = req.query.bookingId
    }
    const status = String(req.query.status ?? '')
    if (['logged', 'verified', 'rejected'].includes(status)) {
      filter.status = status
    }

    const [sessions, total, loggedCount] = await Promise.all([
      Session.find(filter)
        .sort({ date: -1, startTime: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('mentorId', 'firstName lastName')
        .populate('studentId', 'firstName email')
        .populate('bookingId', 'studentName bookingType paymentFrequency selectedSyllabus selectedClass'),
      Session.countDocuments(filter),
      // Verification-queue badge (scoped the same way, ignoring status filter).
      Session.countDocuments({ ...filter, status: 'logged' }),
    ])

    return res.status(200).json({
      message: 'Sessions fetched successfully',
      sessions,
      counts: { logged: loggedCount },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit,
      },
    })
  }
)

/**
 * PATCH /api/sessions/:sessionId  (TUTOR — own, only while 'logged')
 */
export const updateSessionController = catchAsync(
  async (req: Request, res: Response) => {
    const { sessionId } = req.params
    if (!mongooseIdValidator(sessionId)) {
      return res.status(400).json({ message: 'Invalid sessionId' })
    }
    const session: any = await Session.findById(sessionId)
    if (!session) {
      return res.status(404).json({ message: 'Session not found' })
    }
    if (String(session.mentorId) !== String((req as any).user?._id)) {
      return res.status(403).json({ message: 'Not your session.' })
    }
    if (session.status !== 'logged') {
      return res.status(409).json({
        message: 'Only unverified (logged) sessions can be edited.',
      })
    }

    const body = req.body ?? {}
    if (body.date !== undefined || body.startTime !== undefined || body.endTime !== undefined) {
      const times = validateTimes({
        date: body.date ?? session.date.toISOString(),
        startTime: body.startTime ?? session.startTime,
        endTime: body.endTime ?? session.endTime,
      })
      if ('error' in times) {
        return res.status(400).json({ message: times.error })
      }
      session.date = times.date
      session.startTime = times.startTime
      session.endTime = times.endTime
      session.durationMinutes = minutesBetween(times.startTime, times.endTime)
    }
    if (typeof body.notes === 'string') session.notes = body.notes.trim()

    try {
      await session.save()
    } catch (err: unknown) {
      if ((err as { code?: number })?.code === 11000) {
        return res.status(409).json({
          message: 'A session at this date and time is already logged.',
        })
      }
      throw err
    }
    return res.status(200).json({ message: 'Session updated', session })
  }
)

/**
 * DELETE /api/sessions/:sessionId  (TUTOR own while 'logged'; ADMIN any unbilled)
 */
export const deleteSessionController = catchAsync(
  async (req: Request, res: Response) => {
    const { sessionId } = req.params
    if (!mongooseIdValidator(sessionId)) {
      return res.status(400).json({ message: 'Invalid sessionId' })
    }
    const session: any = await Session.findById(sessionId)
    if (!session) {
      return res.status(404).json({ message: 'Session not found' })
    }
    const user = (req as any).user
    const isAdmin = user?.role === 'ADMIN'
    const isOwner = String(session.mentorId) === String(user?._id)
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Not your session.' })
    }
    if (!isAdmin && session.status !== 'logged') {
      return res.status(409).json({
        message: 'Only unverified (logged) sessions can be deleted.',
      })
    }
    if (session.invoiceId) {
      return res.status(409).json({
        message: 'This session is billed on an invoice and cannot be deleted.',
      })
    }

    await Session.deleteOne({ _id: session._id })
    audit({
      entityType: 'session',
      entityId: session._id,
      action: 'session_delete',
      actorId: user?._id,
      actorRole: user?.role,
    })
    return res.status(200).json({ message: 'Session deleted' })
  }
)

/**
 * PATCH /api/sessions/:sessionId/verify  (ADMIN)
 * Marks the session billable. For per-session bookings this also generates
 * the invoice immediately.
 */
export const verifySessionController = catchAsync(
  async (req: Request, res: Response) => {
    const { sessionId } = req.params
    if (!mongooseIdValidator(sessionId)) {
      return res.status(400).json({ message: 'Invalid sessionId' })
    }
    const session: any = await Session.findById(sessionId)
    if (!session) {
      return res.status(404).json({ message: 'Session not found' })
    }
    if (session.status !== 'logged') {
      return res
        .status(409)
        .json({ message: 'Only logged sessions can be verified.' })
    }

    session.status = 'verified'
    session.verifiedBy = (req as any).user?._id ?? null
    session.verifiedAt = new Date()
    await session.save()

    audit({
      entityType: 'session',
      entityId: session._id,
      action: 'session_verify',
      actorId: (req as any).user?._id,
      actorRole: 'ADMIN',
    })
    sendPushToUser(String(session.mentorId ?? ''), {
      title: 'Session verified',
      body: 'An admin verified your logged session.',
      data: { type: 'session_verified', sessionId: String(session._id) },
    }).catch(err => console.error('[push] session verify failed:', err.message))

    // Per-session bookings invoice the moment the session becomes billable.
    const booking = await Booking.findById(session.bookingId).select(
      'paymentFrequency billingMode'
    )
    let invoice: unknown = null
    if (
      booking?.billingMode === 'metered' &&
      booking?.paymentFrequency === 'per-session'
    ) {
      const result = await generateInvoiceForSession(String(session._id), {
        generatedBy: String((req as any).user?._id ?? 'verify'),
      })
      if (result.outcome === 'generated') invoice = result.invoice
    }

    return res.status(200).json({ message: 'Session verified', session, invoice })
  }
)

/**
 * PATCH /api/sessions/:sessionId/reject  (ADMIN)
 */
export const rejectSessionController = catchAsync(
  async (req: Request, res: Response) => {
    const { sessionId } = req.params
    if (!mongooseIdValidator(sessionId)) {
      return res.status(400).json({ message: 'Invalid sessionId' })
    }
    const session: any = await Session.findById(sessionId)
    if (!session) {
      return res.status(404).json({ message: 'Session not found' })
    }
    if (session.status !== 'logged') {
      return res
        .status(409)
        .json({ message: 'Only logged sessions can be rejected.' })
    }

    const reason =
      typeof req.body?.reason === 'string' ? req.body.reason.trim() : ''
    session.status = 'rejected'
    session.rejectReason = reason
    session.verifiedBy = (req as any).user?._id ?? null
    session.verifiedAt = new Date()
    await session.save()

    audit({
      entityType: 'session',
      entityId: session._id,
      action: 'session_reject',
      actorId: (req as any).user?._id,
      actorRole: 'ADMIN',
      meta: reason ? { reason } : undefined,
    })
    sendPushToUser(String(session.mentorId ?? ''), {
      title: 'Session rejected',
      body: reason
        ? `A logged session was rejected: ${reason}`
        : 'A logged session was rejected.',
      data: { type: 'session_rejected', sessionId: String(session._id) },
    }).catch(err => console.error('[push] session reject failed:', err.message))

    return res.status(200).json({ message: 'Session rejected', session })
  }
)
