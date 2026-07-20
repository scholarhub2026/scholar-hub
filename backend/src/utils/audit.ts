import { Types } from 'mongoose'
import AuditLog, { IAuditLog } from '../models/AuditLog'

type AuditInput = {
  entityType: IAuditLog['entityType']
  // unknown: mongoose Document _id is typed unknown; String()-cast on write.
  entityId: Types.ObjectId | string | unknown
  action: string
  actorId?: Types.ObjectId | string | unknown | null
  actorRole?: string
  changes?: Record<string, unknown>
  meta?: Record<string, unknown>
}

/**
 * Fire-and-forget audit entry — never fails the calling request (same
 * best-effort stance as sendMail/push). Await it only in tests.
 */
export const audit = (input: AuditInput): Promise<unknown> =>
  AuditLog.create({
    ...input,
    entityId: new Types.ObjectId(String(input.entityId)),
    actorId: input.actorId ? new Types.ObjectId(String(input.actorId)) : null,
    actorRole: input.actorRole ?? 'SYSTEM',
  }).catch((err) => {
    console.error('audit log write failed:', err?.message ?? err)
  })
