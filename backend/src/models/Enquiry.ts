import mongoose, { Types } from 'mongoose'

/**
 * A student's class enquiry against a specific mentor — the new front door
 * (replaces self-service booking). The admin contacts the parties offline and
 * then creates the actual Booking from this record (status → converted).
 */
export interface IEnquiry {
  studentName: string
  email: string
  phone: string
  mentorId: Types.ObjectId
  mentorName?: string // denormalized for the admin list + emails
  selectedSyllabus?: string
  classId?: Types.ObjectId | null
  className?: string
  enquiryType: 'demo' | 'subject-wise'
  subjects: { subjectId?: Types.ObjectId | null; name: string; price: number }[]
  estimatedAmount: number // 0 for a demo
  message?: string
  status: 'new' | 'contacted' | 'converted' | 'closed'
  bookingId?: Types.ObjectId | null // set when the admin converts it
  createdAt?: Date
  updatedAt?: Date
}

const EnquirySchema = new mongoose.Schema<IEnquiry>(
  {
    studentName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthModal',
      required: true,
    },
    mentorName: { type: String, default: '' },
    selectedSyllabus: { type: String, default: '' },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassesModel',
      default: null,
    },
    className: { type: String, default: '' },
    enquiryType: {
      type: String,
      enum: ['demo', 'subject-wise'],
      required: true,
    },
    subjects: [
      {
        subjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'SubjectModel',
          default: null,
        },
        name: { type: String, default: '' },
        price: { type: Number, default: 0 },
      },
    ],
    estimatedAmount: { type: Number, default: 0 },
    message: { type: String, default: '' },
    status: {
      type: String,
      enum: ['new', 'contacted', 'converted', 'closed'],
      default: 'new',
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
  },
  { timestamps: true }
)

// Admin list: recent-first, filterable by status.
EnquirySchema.index({ status: 1, createdAt: -1 })
EnquirySchema.index({ mentorId: 1, createdAt: -1 })

export default mongoose.model('Enquiry', EnquirySchema)
