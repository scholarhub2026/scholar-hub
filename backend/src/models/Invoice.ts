import mongoose, { Types } from 'mongoose'

/**
 * One billing cycle of a metered booking (SRD: Invoices generate post-class
 * receipt documents; per-cycle statuses Payment Due → Paid → Settled).
 * Immutable after creation except for the status-machine fields — corrections
 * are done by voiding + regenerating, never by editing amounts.
 */
export interface IInvoiceLineItem {
  description: string
  subjectId?: Types.ObjectId | null
  sessionIds: Types.ObjectId[]
  quantity: number // #sessions or hours
  unit: 'session' | 'hour'
  rate: number
  amount: number
}

export interface IInvoice {
  invoiceNumber: string
  bookingId: Types.ObjectId
  studentId: Types.ObjectId
  mentorId: Types.ObjectId
  studentName?: string
  email?: string
  mentorName?: string
  bookingType?: 'full' | 'individual' | 'multiple' | ''
  paymentFrequency?: string
  periodStart: Date // UTC midnight, inclusive
  periodEnd: Date // UTC midnight, exclusive
  periodLabel?: string
  lineItems: IInvoiceLineItem[]
  amount: number
  currency?: string
  status: 'payment_due' | 'paid' | 'settled' | 'void'
  // Double-generation guard key: `${bookingId}|${periodStart ISO date}` while
  // the invoice is live, null once voided (frees the period for regeneration).
  // Same nullable-unique-key pattern as Booking.reservedSlots.claimKey.
  periodKey?: string | null
  paidAt?: Date | null
  paymentId?: Types.ObjectId | null
  settlementId?: Types.ObjectId | null
  voidReason?: string
  generatedBy?: string // 'cron' | 'verify' | admin user id
  lastReminderAt?: Date | null // due-reminder dedup (real instant)
  createdAt?: Date
  updatedAt?: Date
}

const LineItemSchema = new mongoose.Schema<IInvoiceLineItem>(
  {
    description: { type: String, required: true },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubjectModel',
      default: null,
    },
    sessionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Session' }],
    quantity: { type: Number, required: true },
    unit: { type: String, enum: ['session', 'hour'], required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
)

const InvoiceSchema = new mongoose.Schema<IInvoice>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthModal',
      required: true,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthModal',
      required: true,
    },
    // Denormalized display fields (survive account edits/deletes).
    studentName: { type: String, default: '' },
    email: { type: String, default: '', lowercase: true, trim: true },
    mentorName: { type: String, default: '' },
    bookingType: {
      type: String,
      enum: ['full', 'individual', 'multiple', ''],
      default: '',
    },
    paymentFrequency: { type: String, default: '' },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    periodLabel: { type: String, default: '' },
    lineItems: { type: [LineItemSchema], default: [] },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['payment_due', 'paid', 'settled', 'void'],
      default: 'payment_due',
    },
    periodKey: { type: String, default: null },
    paidAt: { type: Date, default: null },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    settlementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Settlement',
      default: null,
    },
    voidReason: { type: String, default: '' },
    generatedBy: { type: String, default: 'cron' },
    lastReminderAt: { type: Date, default: null },
  },
  { timestamps: true }
)

// Immutability: after creation only the status machine may move. Amounts and
// line items are corrected by void + regenerate (audited), never edited.
const MUTABLE_PATHS = new Set([
  'status',
  'periodKey', // nulled on void to free the period for regeneration
  'paidAt',
  'paymentId',
  'settlementId',
  'voidReason',
  'lastReminderAt',
  'updatedAt',
])
InvoiceSchema.pre('save', function (next) {
  if (this.isNew) return next()
  const illegal = this.modifiedPaths().filter(
    (p) => !MUTABLE_PATHS.has(p) && !p.includes('.')
  )
  if (illegal.length) {
    return next(
      new Error(`Invoice is immutable; cannot modify: ${illegal.join(', ')}`)
    )
  }
  next()
})

// No-transaction double-generation guard: at most one live (non-void) invoice
// per booking period. `periodKey` is set on creation and nulled on void, so
// the concurrent loser hits E11000 and treats it as "already generated" —
// same philosophy as the reservedSlots.claimKey index. (Partial indexes can't
// express `status: {$ne: 'void'}`, hence the nullable key.)
InvoiceSchema.index(
  { periodKey: 1 },
  { unique: true, partialFilterExpression: { periodKey: { $type: 'string' } } }
)
InvoiceSchema.index({ bookingId: 1, periodStart: 1 })
InvoiceSchema.index({ status: 1, periodEnd: 1 }) // due lists + reminders
InvoiceSchema.index({ studentId: 1, status: 1 })
InvoiceSchema.index({ mentorId: 1, status: 1 })

export default mongoose.model('Invoice', InvoiceSchema)
