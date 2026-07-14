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

export const createBookingController = async (req, res) => {
  try {
    const validation = await validateRequiredFeilds(req.body, [
      'studentId',
      'mentorId',

      'studentName',
      'sessionType',
      'agreeToTerms',
      'selectedSyllabus',

      'bookingType',
      'totalAmount',
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

    req.body.otp = generateOTP().otp

    const newBooking = new Booking({
      ...req.body,
    })

    await newBooking.save()

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
    const updatedBooking = await Booking.findByIdAndUpdate(bookingId, updateData, {
      new: true,
    })

    if (!updatedBooking) {
      return res.status(404).json({ message: 'Booking not found' })
    }

    // If this update completed the payment, pay out any pending referral.
    if (updateData.paymentStatus === 'completed') {
      await rewardReferralOnBooking(updatedBooking.studentId?.toString())
    }

    res
      .status(200)
      .json({ message: 'Booking updated successfully', updatedBooking })
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
        filter.bookingStatus = 'confirmed'
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

