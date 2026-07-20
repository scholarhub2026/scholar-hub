import mongoose, { FilterQuery } from 'mongoose'

import { encryptPassword } from '../helpers/Auth'
import Auth from '../models/Auth'
import Booking, { IBooking } from '../models/Booking'
import { generateOTP } from '../utils/generateOTP'
import { generatePass } from '../utils/generatePassword'

import Razorpay from "razorpay";
import {
  mongooseIdValidator,
  validateRequiredFeilds,
} from '../utils/validateFeilds'
import { catchAsync } from '../utils/catchAsync'
import { sendMail } from '../utils/mailService'
import { sendPushToRole, sendPushToUser } from '../utils/pushService'
import { rewardReferralOnBooking } from '../utils/referral'
import {
  getSlotUsage,
  dateKey,
  recurringClaimKey,
  singleClaimKey,
} from '../utils/availability'
import {
  NEW_BOOKING_FREQUENCIES,
  PAYMENT_FREQUENCIES,
  toUtcMidnight,
  todayIST,
} from '../utils/paymentSchedule'
import { PricingError } from '../utils/pricingEngine'
import { resolveRatesForBooking } from '../utils/rateResolution'

export const createBookingController = async (req, res) => {
  try {
    // totalAmount is no longer a client input — the server computes it from
    // the resolved rate card (SRD billing engine).
    const validation = await validateRequiredFeilds(req.body, [
      'studentId',
      'mentorId',

      'studentName',
      'sessionType',
      'agreeToTerms',
      'selectedSyllabus',

      'bookingType',
      'email',
      'phone',
    ])
    if (validation) {
      console.log(validation)
      return res.status(400).json({
        message: 'Please provide all required fields',
        error: validation,
      })
    }

    req.body.paymentStatus = 'pending'

    if (!['full', 'individual', 'multiple'].includes(req.body.bookingType)) {
      return res
        .status(400)
        .json({ message: 'bookingType must be full, individual or multiple' })
    }

    // Legacy clients (older mobile builds) send subject NAMES and no class
    // `_id`; server pricing can't resolve them. Detect that by a missing
    // classId and fall back to the pre-rework flat-fee flow so those clients
    // keep working during the mobile rollout. New clients (web + updated app)
    // send the class `_id` and get server-priced 'metered' bookings.
    // Only a real class `_id` marks a new client. An old-client payload has
    // `class_id: { class, syllabus }` (no _id) — treat that as legacy.
    const quoteClassId = req.body.selectedClass?.class_id?._id
    const isLegacyClient =
      !quoteClassId || !mongooseIdValidator(quoteClassId)

    // ---- Frequency ---- legacy clients may still send 'daily'; new bookings
    // are restricted to per-session/weekly/monthly (SRD).
    const allowedFreqs = isLegacyClient
      ? PAYMENT_FREQUENCIES
      : NEW_BOOKING_FREQUENCIES
    if (
      req.body.paymentFrequency !== undefined &&
      req.body.paymentFrequency !== '' &&
      !allowedFreqs.includes(req.body.paymentFrequency)
    ) {
      return res.status(400).json({
        message: isLegacyClient
          ? 'paymentFrequency must be daily, weekly or monthly'
          : 'paymentFrequency must be per-session, weekly or monthly',
      })
    }
    if (!req.body.paymentFrequency) req.body.paymentFrequency = 'monthly'

    if (isLegacyClient) {
      // Trust the client-sent flat fee (old behaviour); no server pricing.
      req.body.billingMode = 'legacy-flat'
      const amt = Number(req.body.totalAmount)
      req.body.totalAmount = Number.isFinite(amt) && amt >= 0 ? amt : 0
    } else {
      // ---- Server-side pricing (SRD billing engine) ----
      // Resolve the rate card now so misconfigured fees fail loudly at booking
      // time instead of at invoicing. The stored totalAmount is an advisory
      // estimate; real charges come from verified sessions. Rates are
      // re-resolved & frozen at teacher-accept.
      const quoteSubjects: string[] = Array.isArray(req.body.selectedSubjects)
        ? req.body.selectedSubjects.map(String)
        : []
      if (req.body.bookingType === 'individual' && quoteSubjects.length !== 1) {
        return res.status(400).json({
          message: 'Select exactly one subject for an individual booking',
        })
      }
      if (req.body.bookingType === 'multiple' && quoteSubjects.length < 1) {
        return res.status(400).json({
          message: 'Select at least one subject for a multiple booking',
        })
      }
      try {
        const { estimatedAmount } = await resolveRatesForBooking({
          mentorId: String(req.body.mentorId),
          classId: String(quoteClassId),
          bookingType: req.body.bookingType,
          selectedSubjectIds: quoteSubjects,
        })
        req.body.totalAmount = estimatedAmount
      } catch (err) {
        if (err instanceof PricingError) {
          return res.status(422).json({ message: err.message, code: err.code })
        }
        throw err
      }
      req.body.billingMode = 'metered'
    }

    if (req.body.classStartDate) {
      const raw = String(req.body.classStartDate)
      const iso = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00:00.000Z` : raw
      const parsed = new Date(iso)
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ message: 'Invalid classStartDate' })
      }
      const start = toUtcMidnight(parsed)
      if (start.getTime() < todayIST().getTime()) {
        return res
          .status(400)
          .json({ message: 'Class start date must be today or later.' })
      }
      req.body.classStartDate = start
    } else {
      req.body.classStartDate = null
    }

    // Never trust schedule/approval state from the client: bookings are born
    // pending and the payment schedule only starts on admin approval.
    delete req.body.payments
    delete req.body.nextDueDate
    delete req.body.approvedAt
    delete req.body.lastReminderAt
    delete req.body.rejectionReason
    delete req.body.pricingSnapshot
    delete req.body.teacherAcceptedAt
    delete req.body.teacherDeclineReason
    req.body.bookingStatus = 'pending'

    // Normalize email so a returning student is matched case-insensitively
    // (and not re-created into a duplicate-key error).
    req.body.email = String(req.body.email).toLowerCase().trim()
    const studentId = await Auth.findOne({ email: req.body.email }).then(
      user => user?._id
    )
    if (!studentId) {
      const tempPassword = await generatePass()
      await sendMail(req.body.email, 'Your Login credentials', 'user', {
        email: req.body.email,
        pass: tempPassword,
      }).catch(err => {
        console.error('Error sending email:', err)
      })

      const newStudentDetails = await Auth.create({
        firstName: req.body.studentName,
        email: req.body.email,
        phone: req.body.phone,
        role: 'STUDENT',
        password: await encryptPassword(tempPassword),
      })
      req.body.studentId = newStudentDetails._id
    } else {
      req.body.studentId = studentId
    }

    // Guard: don't let a student create a second *unpaid* booking that overlaps
    // one they already have (same mentor + same class/subject). They must pay
    // for or cancel the pending one before booking the same thing again.
    const activeUnpaid = await Booking.find({
      studentId: req.body.studentId,
      mentorId: req.body.mentorId,
      paymentStatus: 'pending',
      bookingStatus: { $ne: 'cancelled' },
    })
    const newSubjects = (req.body.selectedSubjects || []).map(String)
    const newClassId = req.body.selectedClass?.class_id?._id?.toString()
    const hasClash = activeUnpaid.some(b => {
      const bClassId = b.selectedClass?.class_id?._id?.toString()
      // A full-class booking covers the whole class, so any overlap on the same
      // class (full or individual) counts as a duplicate.
      if (req.body.bookingType === 'full' || b.bookingType === 'full') {
        return Boolean(bClassId && newClassId && bClassId === newClassId)
      }
      // Otherwise it's only a duplicate if a specific subject is booked twice.
      const bSubjects = (b.selectedSubjects || []).map(String)
      return newSubjects.some(s => bSubjects.includes(s))
    })
    if (hasClash) {
      return res.status(409).json({
        message:
          'You already have a booking for this. Please cancel it before booking it again.',
      })
    }

    // ---- Scheduling: validate & reserve weekly slot(s) ----
    // Legacy clients that send no reservedSlots still book (date-less), exactly
    // as before. New clients send the slot(s) the student picked; we validate
    // them against the mentor's template and the current seat usage.
    const rawSlots = Array.isArray(req.body.reservedSlots)
      ? req.body.reservedSlots
      : []
    if (rawSlots.length > 0) {
      const mentor = await Auth.findOne({
        _id: req.body.mentorId,
        role: 'TUTOR',
      }).select('weekly_availability')
      if (!mentor) {
        return res.status(404).json({ message: 'Mentor not found' })
      }
      const template = new Map<string, any>()
      for (const s of (mentor as any).weekly_availability || []) {
        template.set(s._id.toString(), s)
      }

      const usage = await getSlotUsage(req.body.mentorId)
      const todayKey = dateKey(new Date())
      // Count slots requested within THIS payload so two picks on the same
      // date/slot are weighed together against capacity.
      const reqRecurring = new Map<string, number>() // slotId -> count
      const reqSingle = new Map<string, number>() // `${slotId}|dateKey` -> count

      const built: any[] = []
      for (const rs of rawSlots) {
        const slotId = String(rs.slotId || '')
        const tmpl = template.get(slotId)
        if (!tmpl || tmpl.isActive === false) {
          return res
            .status(400)
            .json({ message: 'A selected slot is no longer available.' })
        }
        const cadence: 'recurring' | 'single' =
          rs.cadence === 'single' ? 'single' : 'recurring'
        const capacity = tmpl.capacity ?? 1

        let date: Date | null = null
        if (cadence === 'single') {
          if (!rs.date) {
            return res
              .status(400)
              .json({ message: 'A date is required for a single session.' })
          }
          const raw = String(rs.date)
          const iso = /^\d{4}-\d{2}-\d{2}$/.test(raw)
            ? `${raw}T00:00:00.000Z`
            : raw
          const parsed = new Date(iso)
          if (isNaN(parsed.getTime())) {
            return res.status(400).json({ message: 'Invalid session date.' })
          }
          // Normalize to UTC midnight so all holds on a day share one key.
          date = new Date(
            Date.UTC(
              parsed.getUTCFullYear(),
              parsed.getUTCMonth(),
              parsed.getUTCDate()
            )
          )
          if (dateKey(date) < todayKey) {
            return res
              .status(400)
              .json({ message: 'Session date must be today or later.' })
          }
          if (date.getUTCDay() !== tmpl.dayOfWeek) {
            return res.status(400).json({
              message: 'Selected date does not match the slot weekday.',
            })
          }
        }

        // ---- capacity check (recurring holds occupy every matching weekday) ----
        const u = usage.get(slotId)
        const recurringUsed = u?.recurring || 0
        if (cadence === 'recurring') {
          const already = reqRecurring.get(slotId) || 0
          if (recurringUsed + already + 1 > capacity) {
            return res
              .status(409)
              .json({ message: 'That slot is fully booked.' })
          }
          reqRecurring.set(slotId, already + 1)
        } else {
          const k = dateKey(date as Date)
          const singleUsed = u?.single.get(k) || 0
          const reqKey = `${slotId}|${k}`
          const already = reqSingle.get(reqKey) || 0
          if (recurringUsed + singleUsed + already + 1 > capacity) {
            return res.status(409).json({
              message: 'That slot is fully booked on the selected date.',
            })
          }
          reqSingle.set(reqKey, already + 1)
        }

        // claimKey backstops the 1-on-1 race; group slots leave it null.
        let claimKey: string | null = null
        if (capacity === 1) {
          claimKey =
            cadence === 'recurring'
              ? recurringClaimKey(slotId)
              : singleClaimKey(slotId, date as Date)
        }

        built.push({
          slotId: tmpl._id,
          dayOfWeek: tmpl.dayOfWeek,
          startTime: tmpl.startTime,
          endTime: tmpl.endTime,
          cadence,
          date,
          claimKey,
        })
      }

      req.body.reservedSlots = built
      req.body.scheduleCadence = built.every(b => b.cadence === 'single')
        ? 'single'
        : 'recurring'
      const singleDates = built
        .filter(b => b.cadence === 'single' && b.date)
        .map(b => (b.date as Date).getTime())
      req.body.bookingDate = singleDates.length
        ? new Date(Math.min(...singleDates))
        : null
      // Single-session bookings start on their first session day.
      if (!req.body.classStartDate && req.body.bookingDate) {
        req.body.classStartDate = req.body.bookingDate
      }
    } else {
      req.body.reservedSlots = []
    }

    req.body.otp = generateOTP().otp

    const newBooking = new Booking({
      ...req.body,
    })

    try {
      await newBooking.save()
    } catch (e: any) {
      // Unique claimKey index tripped → someone grabbed the 1-on-1 slot first.
      if (e && e.code === 11000) {
        return res.status(409).json({
          message: 'That slot was just taken. Please pick another.',
        })
      }
      throw e
    }

    // Notify the booked mentor and all admins (non-blocking — never fail the
    // booking if push is unconfigured or errors).
    const bookingId = newBooking._id.toString()
    const studentName = req.body.studentName as string
    sendPushToUser(req.body.mentorId, {
      title: 'New session booking',
      body: `${studentName} booked a session with you.`,
      data: { type: 'booking', bookingId },
    }).catch(err => console.error('[push] mentor notify failed:', err.message))
    sendPushToRole('ADMIN', {
      title: 'New session booking',
      body: `${studentName} placed a new booking.`,
      data: { type: 'booking', bookingId },
    }).catch(err => console.error('[push] admin notify failed:', err.message))

    res
      .status(201)
      .json({ message: 'Booking created successfully', newBooking })
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Server Error', error: error.message })
  }
}

export const updateBookingController = async (req, res) => {
  try {
    const { bookingId } = req.params

    if (!mongooseIdValidator(bookingId)) {
      return res.status(400).json({ message: 'Invalid bookingId' })
    }
    const updateData = req.body
    // If this update cancels/fails the booking, also release any held seats
    // and stop the payment schedule.
    if (
      updateData.bookingStatus === 'cancelled' ||
      updateData.paymentStatus === 'cancelled' ||
      updateData.paymentStatus === 'failed'
    ) {
      updateData['reservedSlots.$[].claimKey'] = null
      updateData.nextDueDate = null
    }
    const updatedBooking = await Booking.findByIdAndUpdate(bookingId, updateData, {
      new: true,
    })

    if (!updatedBooking) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    // If this update completed the payment, pay out any pending referral and
    // let the student know their booking is confirmed.
    if (updateData.paymentStatus === 'completed') {
      await rewardReferralOnBooking(updatedBooking.studentId?.toString())
      sendPushToUser(updatedBooking.studentId?.toString() ?? '', {
        title: 'Booking confirmed',
        body: 'Your payment was received and your session is confirmed.',
        data: { type: 'booking', bookingId },
      }).catch(err => console.error('[push] student notify failed:', err.message))
    }

    res
      .status(200)
      .json({ message: 'Booking updated successfully', updatedBooking })
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error })
  }
}

export const cancelBookingController = async (req, res) => {
  try {
    const { bookingId } = req.params

    if (!mongooseIdValidator(bookingId)) {
      return res.status(400).json({ message: 'Invalid bookingId' })
    }

    const booking = await Booking.findById(bookingId)
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    // Only the student who made it (or an admin) may cancel it.
    const isOwner = booking.studentId?.toString() === req.user?._id
    const isAdmin = req.user?.role === 'ADMIN'
    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: 'You can only cancel your own bookings.' })
    }

    // A paid booking can't be self-cancelled here (needs admin/refund handling).
    if (booking.paymentStatus === 'completed') {
      return res.status(400).json({
        message: 'This booking is already paid and cannot be cancelled here.',
      })
    }

    booking.bookingStatus = 'cancelled'
    booking.paymentStatus = 'cancelled'
    booking.nextDueDate = null // drop out of due lists & reminders
    // Free any held seats: nulling claimKey releases the 1-on-1 unique index so
    // the slot can be booked again. (Counts already ignore cancelled bookings.)
    if (booking.reservedSlots?.length) {
      booking.reservedSlots.forEach((s: any) => {
        s.claimKey = null
      })
    }
    await booking.save()

    return res.status(200).json({ message: 'Booking cancelled', booking })
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error })
  }
}

export const deleteBookingController = async (req, res) => {
  try {
    const { bookingId } = req.params

    if (!mongooseIdValidator(bookingId)) {
      return res.status(400).json({ message: 'Invalid bookingId' })
    }

    const deleted = await Booking.findByIdAndDelete(bookingId)
    if (!deleted) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    return res.status(200).json({ message: 'Booking deleted successfully' })
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error })
  }
}

export const getBookingsForAdmin = async (req, res) => {
  try {
    const { studentId } = req.params
    const { page = 1, limit = 10, search = '' } = req.query

    // Validate ID
    if (!mongooseIdValidator(studentId)) {
      return res.status(400).json({ message: 'Invalid studentId' })
    }

    // Get user role
    const user = await Auth.findById(studentId).select('role')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    const { role } = user
    let filter: FilterQuery<IBooking> = {}

    switch (role) {
      case 'ADMIN':
        break
      case 'TUTOR':
        filter.mentorId = studentId
        // Active teaching + history; 'approved' requests live in the separate
        // GET /booking/mentor/requests queue.
        filter.bookingStatus = { $in: ['confirmed', 'completed', 'closed'] }
        break
      case 'STUDENT':
        filter.studentId = studentId
        break
      default:
        return res.status(403).json({ message: 'Access denied' })
    }

    const skip = (Number(page) - 1) * Number(limit)

    // Fetch all matching bookings with student + mentor info
    const bookings = await Booking.find(filter)
      .populate('studentId', 'firstName email phone')
      .populate('mentorId', 'firstName email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))

    // Simple in-memory search filter
    const searchLower = search.toLowerCase()
    const filteredBookings = bookings.filter(b =>
      [
        b.studentId?.firstName,
        b.studentId?.email,
        b.mentorId?.firstName,
        b.mentorId?.email,
      ]
        .filter(Boolean)
        .some(val => val.toLowerCase().includes(searchLower))
    )

    if (!filteredBookings.length) {
      return res
        .status(202)
        .json({ bookings: [], message: 'No bookings found' })
    }

    const totalBookings = await Booking.countDocuments(filter)
    const totalPages = Math.ceil(totalBookings / Number(limit))

    return res.status(200).json({
      message: 'Bookings retrieved successfully',
      bookings: filteredBookings,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalRecords: totalBookings,
        limit: Number(limit),
      },
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
}

/**
 * GET /api/booking/mentor/:mentorId/earnings
 * Mentor/Admin — aggregate a mentor's paid earnings (B3). Replaces the
 * client-side derivation the mobile app does today.
 */
export const getMentorEarningsController = catchAsync(async (req, res) => {
  const { mentorId } = req.params
  if (!mongooseIdValidator(mentorId)) {
    return res.status(400).json({ message: 'Invalid mentorId' })
  }

  const mid = new mongoose.Types.ObjectId(mentorId)
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const sumGroup = { _id: null, total: { $sum: '$totalAmount' }, sessions: { $sum: 1 } }

  const [completed, monthly, pending, recent] = await Promise.all([
    Booking.aggregate([
      { $match: { mentorId: mid, paymentStatus: 'completed' } },
      { $group: sumGroup },
    ]),
    Booking.aggregate([
      {
        $match: {
          mentorId: mid,
          paymentStatus: 'completed',
          createdAt: { $gte: monthStart },
        },
      },
      { $group: sumGroup },
    ]),
    Booking.aggregate([
      { $match: { mentorId: mid, paymentStatus: 'pending' } },
      { $group: sumGroup },
    ]),
    Booking.find({ mentorId: mid, paymentStatus: 'completed' })
      .select('studentName totalAmount createdAt sessionMode bookingType')
      .sort({ createdAt: -1 })
      .limit(10),
  ])

  return res.status(200).json({
    message: 'Earnings retrieved successfully',
    data: {
      totalEarnings: completed[0]?.total ?? 0,
      totalSessions: completed[0]?.sessions ?? 0,
      thisMonthEarnings: monthly[0]?.total ?? 0,
      thisMonthSessions: monthly[0]?.sessions ?? 0,
      pendingEarnings: pending[0]?.total ?? 0,
      pendingSessions: pending[0]?.sessions ?? 0,
      recent,
    },
  })
})

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});
export const generatePaymentLink = async (req, res) => {
  try {
        const { amount, name, email, contact, orderId } = req.body;

        console.log(req.body);
        
        const paymentLink = await razorpay.paymentLink.create({
      amount: amount * 100, // in paise
      currency: "INR",
      description: `Payment for Order ${orderId || 'N/A'}`,
      customer: {
        name,
        email,
        contact,
      },
      notify: {
        sms: true,
        email: true,
        whatsapp: true,
      },
      reminder_enable: true,
      callback_url: `https://www.scholarhub.live/`,
      callback_method: "get",
      
    });

    res.json({ success: true, paymentLink });

    
  } catch (error) {
    return res.status(500).json({ message: 'Server Error', error })
  }
}

