import mongoose, { Document, Types } from 'mongoose'

export interface IReview extends Document {
  mentorId: Types.ObjectId // Ref: AuthModal (TUTOR)
  studentId: Types.ObjectId // Ref: AuthModal (STUDENT / parent)
  bookingId?: Types.ObjectId // Ref: Booking
  studentName: string
  rating: number // 1..5
  comment?: string
  createdAt?: Date
  updatedAt?: Date
}

const ReviewSchema = new mongoose.Schema<IReview>(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthModal',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthModal',
      required: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    studentName: {
      type: String,
      default: '',
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
)

// One review per student per mentor — subsequent submissions update the same doc.
ReviewSchema.index({ mentorId: 1, studentId: 1 }, { unique: true })

export default mongoose.model<IReview>('Review', ReviewSchema)
