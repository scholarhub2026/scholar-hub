import { Router } from 'express'
import type { Request, Response } from 'express'
import AuditLog from '../models/AuditLog'
import { catchAsync } from '../utils/catchAsync'
import { requireAuth, requireRole } from '../middleware/auth'
import { mongooseIdValidator } from '../utils/validateFeilds'

export const AuditRouter = Router()

/**
 * GET /api/audit  (ADMIN)
 * Query: entityType?, entityId?, page, limit. Read-only — there are no write
 * routes for audit logs by design (SRD compliance: immutable audit trail).
 */
AuditRouter.get(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  catchAsync(async (req: Request, res: Response) => {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1)
    const limit = Math.min(
      200,
      Math.max(1, parseInt(String(req.query.limit ?? '50'), 10) || 50)
    )

    const filter: Record<string, unknown> = {}
    const entityType = String(req.query.entityType ?? '')
    if (['booking', 'session', 'invoice', 'payment', 'settlement'].includes(entityType)) {
      filter.entityType = entityType
    }
    if (req.query.entityId && mongooseIdValidator(req.query.entityId as any)) {
      filter.entityId = req.query.entityId
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('actorId', 'firstName lastName email'),
      AuditLog.countDocuments(filter),
    ])

    return res.status(200).json({
      message: 'Audit logs fetched successfully',
      logs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit,
      },
    })
  })
)
