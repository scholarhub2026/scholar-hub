import { Request, Response } from 'express'

import Auth from '../models/Auth'
import Invoice from '../models/Invoice'
import Settlement from '../models/Settlement'
import { nextNumber } from '../models/Counter'
import { audit } from '../utils/audit'
import { catchAsync } from '../utils/catchAsync'
import { sendMail } from '../utils/mailService'
import { sendPushToUser } from '../utils/pushService'
import { formatDueDate, toUtcMidnight } from '../utils/paymentSchedule'
import { mongooseIdValidator } from '../utils/validateFeilds'

/**
 * POST /api/settlements  (ADMIN)
 * Body: { mentorId, invoiceIds: string[], amount, method?, reference?, note?, paidAt? }
 * Records a manual payout to the mentor covering the given PAID invoices.
 * There is no platform commission — the admin enters the payout amount
 * (defaults to the invoices' total).
 */
export const createSettlementController = catchAsync(
  async (req: Request, res: Response) => {
    const body = req.body ?? {}
    const { mentorId } = body
    if (!mentorId || !mongooseIdValidator(mentorId)) {
      return res.status(400).json({ message: 'Valid mentorId is required' })
    }
    const invoiceIds: string[] = Array.isArray(body.invoiceIds)
      ? body.invoiceIds.map(String)
      : []
    if (!invoiceIds.length || invoiceIds.some((id) => !mongooseIdValidator(id as any))) {
      return res
        .status(400)
        .json({ message: 'invoiceIds must be a non-empty list of invoice ids' })
    }

    // Every invoice must be PAID, unsettled, and belong to this mentor.
    const invoices = await Invoice.find({ _id: { $in: invoiceIds } })
    if (invoices.length !== invoiceIds.length) {
      return res.status(404).json({ message: 'One or more invoices not found' })
    }
    const bad = invoices.find(
      (inv) =>
        inv.status !== 'paid' || String(inv.mentorId) !== String(mentorId)
    )
    if (bad) {
      return res.status(409).json({
        message: `Invoice ${bad.invoiceNumber} is not a paid, unsettled invoice of this mentor.`,
      })
    }

    const invoicesTotal = invoices.reduce((sum, inv) => sum + inv.amount, 0)
    const amount = body.amount !== undefined ? Number(body.amount) : invoicesTotal
    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ message: 'Invalid amount' })
    }
    const paidAt = body.paidAt ? new Date(body.paidAt) : new Date()
    if (isNaN(paidAt.getTime())) {
      return res.status(400).json({ message: 'Invalid paidAt' })
    }

    const mentor = await Auth.findById(mentorId).select('firstName lastName email')
    const mentorName =
      `${mentor?.firstName ?? ''} ${mentor?.lastName ?? ''}`.trim() || 'Mentor'

    const settlement = await Settlement.create({
      settlementNumber: await nextNumber('settlement'),
      mentorId,
      mentorName,
      invoiceIds,
      amount,
      method: ['bank-transfer', 'upi', 'cash'].includes(body.method)
        ? body.method
        : 'bank-transfer',
      reference: typeof body.reference === 'string' ? body.reference.trim() : '',
      note: typeof body.note === 'string' ? body.note.trim() : '',
      paidAt,
      recordedBy: (req as any).user?._id ?? null,
    })

    // Move the covered invoices to settled. Filter on status keeps this safe
    // if two admins race — the loser settles 0 and we roll back.
    const updated = await Invoice.updateMany(
      { _id: { $in: invoiceIds }, status: 'paid' },
      { $set: { status: 'settled', settlementId: settlement._id } }
    )
    if (updated.modifiedCount !== invoiceIds.length) {
      // Roll back: un-settle whatever we settled and void the settlement.
      await Invoice.updateMany(
        { settlementId: settlement._id },
        { $set: { status: 'paid', settlementId: null } }
      )
      settlement.status = 'void'
      settlement.voidReason = 'Concurrent settlement conflict'
      await settlement.save()
      return res.status(409).json({
        message: 'Some invoices were settled by another admin. Try again.',
      })
    }

    audit({
      entityType: 'settlement',
      entityId: settlement._id,
      action: 'settlement_record',
      actorId: (req as any).user?._id,
      actorRole: 'ADMIN',
      meta: {
        mentorId: String(mentorId),
        amount,
        invoiceCount: invoiceIds.length,
      },
    })

    // Notify the mentor (best-effort).
    if (mentor?.email) {
      sendMail(
        mentor.email,
        `Payout recorded ${settlement.settlementNumber} — Scholar Hub`,
        'settlementRecorded',
        {
          mentorName,
          settlementNumber: settlement.settlementNumber,
          amount,
          invoiceCount: invoiceIds.length,
          method: String(settlement.method),
          reference: settlement.reference || undefined,
          paidAt: formatDueDate(toUtcMidnight(paidAt)),
        }
      ).catch(err => console.error('[mail] settlement failed:', err.message))
    }
    sendPushToUser(String(mentorId), {
      title: 'Payout recorded 💸',
      body: `₹${amount} has been paid out to you (${settlement.settlementNumber}).`,
      data: { type: 'settlement_recorded', settlementId: String(settlement._id) },
    }).catch(err => console.error('[push] settlement failed:', err.message))

    return res.status(201).json({ message: 'Settlement recorded', settlement })
  }
)

/**
 * GET /api/settlements  (ADMIN) — query: mentorId?, page, limit.
 * Also returns the mentors' unsettled (paid) totals for the payout screen.
 */
export const listSettlementsController = catchAsync(
  async (req: Request, res: Response) => {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1)
    const limit = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20)
    )

    const filter: Record<string, unknown> = {}
    if (req.query.mentorId && mongooseIdValidator(req.query.mentorId as any)) {
      filter.mentorId = req.query.mentorId
    }

    const [settlements, total, pendingByMentor] = await Promise.all([
      Settlement.find(filter)
        .sort({ paidAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Settlement.countDocuments(filter),
      // Paid-but-unsettled invoices grouped per mentor → "owed to mentor".
      Invoice.aggregate([
        { $match: { status: 'paid' } },
        {
          $group: {
            _id: '$mentorId',
            mentorName: { $first: '$mentorName' },
            total: { $sum: '$amount' },
            invoices: { $push: { _id: '$_id', invoiceNumber: '$invoiceNumber', amount: '$amount' } },
          },
        },
        { $sort: { total: -1 } },
      ]),
    ])

    return res.status(200).json({
      message: 'Settlements fetched successfully',
      settlements,
      pendingByMentor,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit,
      },
    })
  }
)

/** GET /api/settlements/mentor  (TUTOR) — this mentor's payouts. */
export const mentorSettlementsController = catchAsync(
  async (req: Request, res: Response) => {
    const settlements = await Settlement.find({
      mentorId: (req as any).user?._id,
      status: 'recorded',
    }).sort({ paidAt: -1 })
    const totalReceived = settlements.reduce((sum, s) => sum + s.amount, 0)
    return res.status(200).json({
      message: 'Settlements fetched successfully',
      settlements,
      totalReceived,
    })
  }
)

/**
 * POST /api/settlements/:settlementId/void  (ADMIN) — { reason }
 * Reverses a payout record: covered invoices return to 'paid'.
 */
export const voidSettlementController = catchAsync(
  async (req: Request, res: Response) => {
    const { settlementId } = req.params
    if (!mongooseIdValidator(settlementId)) {
      return res.status(400).json({ message: 'Invalid settlementId' })
    }
    const settlement = await Settlement.findById(settlementId)
    if (!settlement) {
      return res.status(404).json({ message: 'Settlement not found' })
    }
    if (settlement.status !== 'recorded') {
      return res.status(409).json({ message: 'Settlement is already void.' })
    }

    await Invoice.updateMany(
      { settlementId: settlement._id, status: 'settled' },
      { $set: { status: 'paid', settlementId: null } }
    )

    const reason =
      typeof req.body?.reason === 'string' ? req.body.reason.trim() : ''
    settlement.status = 'void'
    settlement.voidReason = reason
    await settlement.save()

    audit({
      entityType: 'settlement',
      entityId: settlement._id,
      action: 'settlement_void',
      actorId: (req as any).user?._id,
      actorRole: 'ADMIN',
      meta: reason ? { reason } : undefined,
    })

    return res.status(200).json({ message: 'Settlement voided', settlement })
  }
)
