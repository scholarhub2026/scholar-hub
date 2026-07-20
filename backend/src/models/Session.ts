import mongoose, { Types } from 'mongoose'

/**
 * A single completed class session, logged by the mentor and verified by the
 * admin. Only 'verified' sessions feed invoice computation (SRD: "Sessions &
 * Attendance registers actual execution durations used directly for hourly
 * payment calculations"). Replaces the free-text Booking.bookingLogs[] for
 * metered bookings; old logs remain readable and are copied here read-only.
 */
export interface ISession {
  bookingId: Types.ObjectId
  mentorId: Types.ObjectId // denormalized for queue queries
  studentId: Types.ObjectId
  date: Date // UTC-midnight calendar date (same convention as reservedSlots.date)
  startTime: string // "HH:mm" 24h
  endTime: string
  durationMinutes: number // server-computed from times, never client-trusted
  subjectId?: Types.ObjectId | null // required when booking.bookingType === 'multiple'
  subjectName?: string
  notes?: string
  status: 'logged' | 'verified' | 'rejected'
  verifiedBy?: Types.ObjectId | null
  verifiedAt?: Date | null
  rejectReason?: string
  invoiceId?: Types.ObjectId | null // set when billed → doc becomes immutable
  loggedBy?: Types.ObjectId | null
  migratedFromLog?: boolean
  createdAt?: Date
  updatedAt?: Date
}

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

const SessionSchema = new mongoose.Schema<ISession>(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
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
    date: { type: Date, required: true },
    startTime: { type: String, required: true, match: TIME_RE },
    endTime: { type: String, required: true, match: TIME_RE },
    durationMinutes: { type: Number, required: true, min: 1 },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubjectModel',
      default: null,
    },
    subjectName: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['logged', 'verified', 'rejected'],
      default: 'logged',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthModal',
      default: null,
    },
    verifiedAt: { type: Date, default: null },
    rejectReason: { type: String, default: '' },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      default: null,
    },
    loggedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthModal',
      default: null,
    },
    migratedFromLog: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// Zero-padded "HH:mm" compares correctly as strings.
SessionSchema.pre('validate', function (next) {
  const s = this as unknown as ISession
  if (s.startTime && s.endTime && s.endTime <= s.startTime) {
    return next(new Error('endTime must be after startTime'))
  }
  next()
})

// Once billed, a session is part of an immutable invoice — block all edits.
SessionSchema.pre('save', function (next) {
  if (!this.isNew && !this.isModified()) return next()
  const billed = !this.isNew && !this.isModified('invoiceId') && this.invoiceId
  if (billed) {
    return next(new Error('Session is billed on an invoice and cannot be modified'))
  }
  next()
})

// Duplicate-log guard: a mentor can't log the same booking/date/start twice
// (same unique-index philosophy as reservedSlots.claimKey — no transactions).
SessionSchema.index({ bookingId: 1, date: 1, startTime: 1 }, { unique: true })
// Admin verification queue + per-booking billing collection.
SessionSchema.index({ status: 1, createdAt: -1 })
SessionSchema.index({ bookingId: 1, status: 1 })
SessionSchema.index({ mentorId: 1, date: -1 })
SessionSchema.index({ invoiceId: 1 })

export default mongoose.model('Session', SessionSchema)
