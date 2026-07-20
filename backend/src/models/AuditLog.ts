import mongoose, { Types } from 'mongoose'

/**
 * Append-only audit trail for billing-sensitive actions (SRD compliance:
 * "immutable transaction logs … systemic audit logs"). There are no update or
 * delete routes for this collection — corrections are new entries.
 */
export interface IAuditLog {
  entityType: 'booking' | 'session' | 'invoice' | 'payment' | 'settlement'
  entityId: Types.ObjectId
  action: string // e.g. 'teacher_accept', 'invoice_void', 'payment_record'
  actorId?: Types.ObjectId | null // null for system/cron actions
  actorRole?: string
  changes?: Record<string, unknown> // small before/after of changed fields
  meta?: Record<string, unknown>
  createdAt?: Date
}

const AuditLogSchema = new mongoose.Schema<IAuditLog>(
  {
    entityType: {
      type: String,
      enum: ['booking', 'session', 'invoice', 'payment', 'settlement'],
      required: true,
    },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    action: { type: String, required: true },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuthModal',
      default: null,
    },
    actorRole: { type: String, default: 'SYSTEM' },
    changes: { type: mongoose.Schema.Types.Mixed, default: undefined },
    meta: { type: mongoose.Schema.Types.Mixed, default: undefined },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

AuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 })

export default mongoose.model('AuditLog', AuditLogSchema)
