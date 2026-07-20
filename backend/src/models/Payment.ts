import mongoose, { Types } from 'mongoose'

/**
 * Append-only payment ledger (SRD: "Payments: Ledger capturing transaction
 * IDs, timestamps, and payment statuses"). One doc per collected payment.
 * There is no edit endpoint — mistakes are voided (audited), never rewritten.
 * Legacy Booking.payments[] entries are copied here by the migration with
 * `legacy: true`.
 */
export interface IPayment {
  receiptNumber: string
  invoiceId?: Types.ObjectId | null // null for legacy-flat collections
  bookingId: Types.ObjectId
  studentId?: Types.ObjectId | null
  amount: number
  method: 'cash' | 'upi' | 'bank-transfer' | 'other'
  collectedAt: Date
  collectedBy?: Types.ObjectId | null
  note?: string
  periodLabel?: string
  status: 'recorded' | 'void'
  voidReason?: string
  legacy?: boolean
  receiptEmailedAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

const PaymentSchema = new mongoose.Schema<IPayment>(
  {
    receiptNumber: { type: String, required: true, unique: true },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Invoice',
      default: null,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthModal',
      default: null,
    },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ['cash', 'upi', 'bank-transfer', 'other'],
      default: 'other',
    },
    collectedAt: { type: Date, default: Date.now },
    collectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthModal',
      default: null,
    },
    note: { type: String, default: '' },
    periodLabel: { type: String, default: '' },
    status: {
      type: String,
      enum: ['recorded', 'void'],
      default: 'recorded',
    },
    voidReason: { type: String, default: '' },
    legacy: { type: Boolean, default: false },
    receiptEmailedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

// Append-only: after creation only void/receipt-email bookkeeping may change.
const MUTABLE_PATHS = new Set(['status', 'voidReason', 'receiptEmailedAt', 'updatedAt'])
PaymentSchema.pre('save', function (next) {
  if (this.isNew) return next()
  const illegal = this.modifiedPaths().filter(
    (p) => !MUTABLE_PATHS.has(p) && !p.includes('.')
  )
  if (illegal.length) {
    return next(
      new Error(`Payment is immutable; cannot modify: ${illegal.join(', ')}`)
    )
  }
  next()
})

// Idempotent record-payment: at most one live (recorded) payment per invoice —
// a double submit hits E11000 and surfaces as a clean 409. Voiding a payment
// removes it from the partial index, allowing a corrected re-record.
PaymentSchema.index(
  { invoiceId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      invoiceId: { $type: 'objectId' },
      status: 'recorded',
    },
  }
)
PaymentSchema.index({ bookingId: 1, collectedAt: -1 })
PaymentSchema.index({ studentId: 1, collectedAt: -1 })

export default mongoose.model('Payment', PaymentSchema)
