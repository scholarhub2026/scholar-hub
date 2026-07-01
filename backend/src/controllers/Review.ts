import { Request, Response } from 'express'
import mongoose from 'mongoose'

import { catchAsync } from '../utils/catchAsync'
import { validateRequiredFeilds, mongooseIdValidator } from '../utils/validateFeilds'
import Review from '../models/Review'
import Booking from '../models/Booking'
import Auth from '../models/Auth'

/**
 * Recompute a mentor's average rating from all its reviews and persist it on
 * the mentor's AuthModal document (the `rating` field the app already reads).
 */
const recomputeMentorRating = async (mentorId: mongoose.Types.ObjectId | string) => {
  const [agg] = await Review.aggregate([
    { $match: { mentorId: new mongoose.Types.ObjectId(mentorId) } },
    {
      $group: {
        _id: '$mentorId',
        average: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ])

  const average = agg ? Number(agg.average.toFixed(1)) : 0
  const count = agg ? agg.count : 0

  await Auth.findByIdAndUpdate(mentorId, { rating: String(average) })

  return { average, count }
}

/**
 * POST /api/review
 * A student/parent who has booked a mentor rates them. One review per
 * (student, mentor) pair — re-submitting updates the existing rating.
 */
export const createReviewController = catchAsync(
  async (req: Request, res: Response) => {
    const error = validateRequiredFeilds(req.body, [
      'studentId',
      'mentorId',
      'rating',
    ])
    if (error) {
      return res.status(400).json({ message: error })
    }

    const { studentId, mentorId, bookingId, comment } = req.body
    const rating = Number(req.body.rating)

    if (!mongooseIdValidator(studentId) || !mongooseIdValidator(mentorId)) {
      return res.status(400).json({ message: 'Invalid studentId or mentorId' })
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' })
    }

    // Only students who actually booked this mentor may review them.
    const booking = await Booking.findOne({ studentId, mentorId }).select('_id')
    if (!booking) {
      return res.status(403).json({
        message: 'You can only rate a mentor you have booked a session with.',
      })
    }

    const student = await Auth.findById(studentId).select('firstName lastName')
    const studentName = student
      ? `${student.firstName ?? ''} ${student.lastName ?? ''}`.trim()
      : ''

    const review = await Review.findOneAndUpdate(
      { studentId, mentorId },
      {
        studentId,
        mentorId,
        bookingId: bookingId ?? booking._id,
        studentName,
        rating,
        comment: comment ?? '',
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )

    const { average, count } = await recomputeMentorRating(mentorId)

    return res.status(201).json({
      message: 'Review submitted successfully',
      review,
      mentorRating: { average, count },
    })
  }
)

/**
 * GET /api/review/mentor/:mentorId?page=&limit=
 * Public list of a mentor's reviews with the aggregate average + count.
 */
export const getMentorReviewsController = catchAsync(
  async (req: Request, res: Response) => {
    const { mentorId } = req.params
    const { page = 1, limit = 10 } = req.query

    if (!mongooseIdValidator(mentorId)) {
      return res.status(400).json({ message: 'Invalid mentorId' })
    }

    const skip = (Number(page) - 1) * Number(limit)

    const [reviews, total, ratingAgg] = await Promise.all([
      Review.find({ mentorId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Review.countDocuments({ mentorId }),
      Review.aggregate([
        { $match: { mentorId: new mongoose.Types.ObjectId(mentorId) } },
        { $group: { _id: '$mentorId', average: { $avg: '$rating' } } },
      ]),
    ])

    const average = ratingAgg[0] ? Number(ratingAgg[0].average.toFixed(1)) : 0

    return res.status(200).json({
      message: 'Reviews retrieved successfully',
      data: reviews,
      average,
      count: total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    })
  }
)
