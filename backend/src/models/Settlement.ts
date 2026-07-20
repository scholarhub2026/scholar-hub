import mongoose, { Types } from 'mongoose'

/**
 * A manual payout from the admin to a mentor covering one or more paid
 * invoices (SRD: "Settlements: Records payouts made to teachers"). There is
 * NO platform commission — the amount is entered by the admin (decided with
 * client). Append-only; corrections via void.
 */
export interface ISettlement {
  settlementNumber: string
  mentorId: Types.ObjectId
  mentorName?: string
  invoiceIds: Types.ObjectId[]
  amount: number
  method: 'bank-transfer' | 'upi' | 'cash' | 'other'
  reference?: string // e.g. bank txn ref / UPI id
  note?: string
  paidAt: Date
  recordedBy?: Types.ObjectId | null
  status: 'recorded' | 'void'
  voidReason?: string
  createdAt?: Date
  updatedAt?: Date
}

const SettlementSchema = new mongoose.Schema<ISettlement>(
  {
    settlementNumber: { type: String, required: true, unique: true },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthModal',
      required: true,
    },
    mentorName: { type: String, default: '' },
    invoiceIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' }],
      default: [],
    },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ['bank-transfer', 'upi', 'cash', 'other'],
      default: 'bank-transfer',
    },
    reference: { type: String, default: '' },
    note: { type: String, default: '' },
    paidAt: { type: Date, default: Date.now },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthModal',
      default: null,
    },
    status: {
      type: String,
      enum: ['recorded', 'void'],
      default: 'recorded',
    },
    voidReason: { type: String, default: '' },
  },
  { timestamps: true }
)

// Append-only: only void bookkeeping may change after creation.
const MUTABLE_PATHS = new Set(['status', 'voidReason', 'updatedAt'])
SettlementSchema.pre('save', function (next) {
  if (this.isNew) return next()
  const illegal = this.modifiedPaths().filter(
    (p) => !MUTABLE_PATHS.has(p) && !p.includes('.')
  )
  if (illegal.length) {
    return next(
      new Error(`Settlement is immutable; cannot modify: ${illegal.join(', ')}`)
    )
  }
  next()
})

SettlementSchema.index({ mentorId: 1, paidAt: -1 })

export default mongoose.model('Settlement', SettlementSchema)
