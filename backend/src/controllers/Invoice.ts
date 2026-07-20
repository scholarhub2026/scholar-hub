import { Request, Response } from 'express'

import Booking from '../models/Booking'
import Invoice from '../models/Invoice'
import Payment from '../models/Payment'
import Session from '../models/Session'
import { nextNumber } from '../models/Counter'
import { audit } from '../utils/audit'
import { catchAsync } from '../utils/catchAsync'
import { generateInvoiceForBooking } from '../utils/invoiceService'
import { sendMail } from '../utils/mailService'
import { sendPushToUser } from '../utils/pushService'
import { rewardReferralOnBooking } from '../utils/referral'
import {
  daysOverdue,
  formatDueDate,
  todayIST,
  toUtcMidnight,
} from '../utils/paymentSchedule'
import { mongooseIdValidator } from '../utils/validateFeilds'

const receiptLineItems = (invoice: any) =>
  (invoice.lineItems ?? []).map((li: any) => ({
    description: li.description,
    amount: li.amount,
  }))

/** Send (or resend) the receipt email for a paid invoice — best-effort. */
const emailReceipt = async (invoice: any, payment: any): Promise<void> => {
  await sendMail(
    invoice.email,
    `Payment receipt ${payment.receiptNumber} — Scholar Hub`,
    'paymentReceipt',
    {
      studentName: invoice.studentName || 'there',
      mentorName: invoice.mentorName || 'your mentor',
      receiptNumber: payment.receiptNumber,
      invoiceNumber: invoice.invoiceNumber,
      periodLabel: invoice.periodLabel ?? '',
      lineItems: receiptLineItems(invoice),
      total: invoice.amount,
      method: String(payment.method),
      collectedAt: formatDueDate(toUtcMidnight(payment.collectedAt)),
    }
  )
  payment.receiptEmailedAt = new Date()
  await payment.save()
}

/**
 * GET /api/invoices  (ADMIN)
 * Query: scope=due|overdue|paid|settled|all (default due), search, page, limit.
 * Mirrors the legacy due-payments list shape (counts for the tabs).
 */
export const listInvoicesController = catchAsync(
  async (req: Request, res: Response) => {
    const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1)
    const limit = Math.min(
      100,
      Math.max(1, parseInt(String(req.query.limit ?? '20'), 10) || 20)
    )
    const scope = String(req.query.scope ?? 'all')
    const search = String(req.query.search ?? '').trim()

    const base: Record<string, any> = {}
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      base.$or = [
        { studentName: rx },
        { email: rx },
        { mentorName: rx },
        { invoiceNumber: rx },
      ]
    }

    const t = todayIST()
    const scoped = { ...base }
    if (scope === 'due') scoped.status = 'payment_due'
    else if (scope === 'overdue') {
      scoped.status = 'payment_due'
      scoped.periodEnd = { $lt: t }
    } else if (scope === 'paid') scoped.status = 'paid'
    else if (scope === 'settled') scoped.status = 'settled'

    const [invoices, total, dueCount, paidCount, settledCount] =
      await Promise.all([
        Invoice.find(scoped)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Invoice.countDocuments(scoped),
        Invoice.countDocuments({ ...base, status: 'payment_due' }),
        Invoice.countDocuments({ ...base, status: 'paid' }),
        Invoice.countDocuments({ ...base, status: 'settled' }),
      ])

    const items = invoices.map((inv) => {
      const overdueDays =
        inv.status === 'payment_due'
          ? daysOverdue(toUtcMidnight(inv.periodEnd), t)
          : 0
      return { ...inv.toObject(), daysOverdue: overdueDays }
    })

    return res.status(200).json({
      message: 'Invoices fetched successfully',
      invoices: items,
      counts: { due: dueCount, paid: paidCount, settled: settledCount },
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalRecords: total,
        limit,
      },
    })
  }
)

/** GET /api/invoices/mine  (STUDENT) — the student's own invoices. */
export const myInvoicesController = catchAsync(
  async (req: Request, res: Response) => {
    const invoices = await Invoice.find({
      studentId: (req as any).user?._id,
      status: { $ne: 'void' },
    }).sort({ createdAt: -1 })
    return res
      .status(200)
      .json({ message: 'Invoices fetched successfully', invoices })
  }
)

/**
 * GET /api/invoices/mentor  (TUTOR) — invoices for this mentor's bookings +
 * earnings summary (billed / collected / settled).
 */
export const mentorInvoicesController = catchAsync(
  async (req: Request, res: Response) => {
    const mentorId = (req as any).user?._id
    const invoices = await Invoice.find({
      mentorId,
      status: { $ne: 'void' },
    }).sort({ createdAt: -1 })

    const summary = invoices.reduce(
      (acc, inv) => {
        acc.billed += inv.amount
        if (inv.status === 'paid' || inv.status === 'settled') {
          acc.collected += inv.amount
        }
        if (inv.status === 'settled') acc.settled += inv.amount
        return acc
      },
      { billed: 0, collected: 0, settled: 0 }
    )

    return res.status(200).json({
      message: 'Invoices fetched successfully',
      invoices,
      summary,
    })
  }
)

/** GET /api/invoices/:invoiceId  (owner student, owner mentor or admin) */
export const getInvoiceController = catchAsync(
  async (req: Request, res: Response) => {
    const { invoiceId } = req.params
    if (!mongooseIdValidator(invoiceId)) {
      return res.status(400).json({ message: 'Invalid invoiceId' })
    }
    const invoice = await Invoice.findById(invoiceId)
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' })
    }
    const user = (req as any).user
    const uid = String(user?._id)
    const allowed =
      user?.role === 'ADMIN' ||
      String(invoice.studentId) === uid ||
      String(invoice.mentorId) === uid
    if (!allowed) {
      return res.status(403).json({ message: 'Access denied' })
    }
    // Include the billed sessions for the detail view.
    const sessions = await Session.find({ invoiceId: invoice._id }).sort({
      date: 1,
    })
    const payment = await Payment.findOne({
      invoiceId: invoice._id,
      status: 'recorded',
    })
    return res.status(200).json({
      message: 'Invoice fetched successfully',
      invoice,
      sessions,
      payment,
    })
  }
)

/**
 * POST /api/invoices/generate  (ADMIN) — { bookingId }
 * On-demand cycle close (e.g. booking ending mid-period): bills the current
 * cycle's verified sessions now instead of waiting for the cron.
 */
export const generateInvoiceController = catchAsync(
  async (req: Request, res: Response) => {
    const { bookingId } = req.body ?? {}
    if (!bookingId || !mongooseIdValidator(bookingId)) {
      return res.status(400).json({ message: 'Valid bookingId is required' })
    }
    const booking = await Booking.findById(bookingId)
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' })
    }
    if (booking.billingMode !== 'metered') {
      return res
        .status(409)
        .json({ message: 'Only metered bookings generate invoices.' })
    }
    if (!['confirmed', 'completed'].includes(booking.bookingStatus ?? '')) {
      return res.status(409).json({
        message: 'Invoices can only be generated for confirmed bookings.',
      })
    }

    const result = await generateInvoiceForBooking(String(booking._id), {
      generatedBy: String((req as any).user?._id ?? 'admin'),
      // Bill everything verified & unbilled to date.
      finalize: booking.bookingStatus === 'completed',
    })

    if (result.outcome === 'generated') {
      return res
        .status(201)
        .json({ message: 'Invoice generated', invoice: result.invoice })
    }
    if (result.outcome === 'empty-period') {
      return res.status(200).json({
        message: 'No billable sessions in this period — nothing to invoice.',
      })
    }
    if (result.outcome === 'duplicate') {
      return res
        .status(409)
        .json({ message: 'An invoice for this period already exists.' })
    }
    return res.status(409).json({ message: result.reason })
  }
)

/**
 * POST /api/invoices/:invoiceId/void  (ADMIN) — { reason }
 * Corrections path: voids an unpaid invoice and releases its sessions so a
 * corrected invoice can be generated. Paid invoices need their payment voided
 * first.
 */
export const voidInvoiceController = catchAsync(
  async (req: Request, res: Response) => {
    const { invoiceId } = req.params
    if (!mongooseIdValidator(invoiceId)) {
      return res.status(400).json({ message: 'Invalid invoiceId' })
    }
    const invoice = await Invoice.findById(invoiceId)
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' })
    }
    if (invoice.status !== 'payment_due') {
      return res.status(409).json({
        message:
          invoice.status === 'paid' || invoice.status === 'settled'
            ? 'Void the recorded payment/settlement first.'
            : 'This invoice is already void.',
      })
    }

    const reason =
      typeof req.body?.reason === 'string' ? req.body.reason.trim() : ''
    invoice.status = 'void'
    invoice.voidReason = reason
    invoice.periodKey = null // frees the period for regeneration
    await invoice.save()

    // Release the billed sessions for re-billing.
    await Session.updateMany(
      { invoiceId: invoice._id },
      { $set: { invoiceId: null } }
    )

    audit({
      entityType: 'invoice',
      entityId: invoice._id,
      action: 'invoice_void',
      actorId: (req as any).user?._id,
      actorRole: 'ADMIN',
      meta: reason ? { reason } : undefined,
    })

    return res.status(200).json({ message: 'Invoice voided', invoice })
  }
)

/**
 * POST /api/invoices/:invoiceId/payments  (ADMIN) — { method?, note?, collectedAt? }
 * THE record-payment for metered bookings: marks the invoice paid, writes the
 * immutable ledger entry and EMAILS THE RECEIPT to the student. Idempotent —
 * the unique one-live-payment-per-invoice index turns double submits into 409.
 */
export const recordInvoicePaymentController = catchAsync(
  async (req: Request, res: Response) => {
    const { invoiceId } = req.params
    if (!mongooseIdValidator(invoiceId)) {
      return res.status(400).json({ message: 'Invalid invoiceId' })
    }
    const invoice = await Invoice.findById(invoiceId)
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' })
    }
    if (invoice.status !== 'payment_due') {
      return res.status(409).json({
        message:
          invoice.status === 'paid' || invoice.status === 'settled'
            ? 'This invoice is already paid.'
            : 'This invoice is void.',
      })
    }

    const body = req.body ?? {}
    const collectedAt = body.collectedAt ? new Date(body.collectedAt) : new Date()
    if (isNaN(collectedAt.getTime())) {
      return res.status(400).json({ message: 'Invalid collectedAt' })
    }

    const receiptNumber = await nextNumber('receipt')
    let payment
    try {
      payment = await Payment.create({
        receiptNumber,
        invoiceId: invoice._id,
        bookingId: invoice.bookingId,
        studentId: invoice.studentId,
        amount: invoice.amount,
        method: ['cash', 'upi', 'bank-transfer'].includes(body.method)
          ? body.method
          : 'other',
        collectedAt,
        collectedBy: (req as any).user?._id ?? null,
        note: typeof body.note === 'string' ? body.note.trim() : '',
        periodLabel: invoice.periodLabel ?? '',
      })
    } catch (err: unknown) {
      if ((err as { code?: number })?.code === 11000) {
        return res.status(409).json({
          message: 'A payment is already recorded for this invoice.',
        })
      }
      throw err
    }

    invoice.status = 'paid'
    invoice.paidAt = collectedAt
    invoice.paymentId = payment._id as any
    await invoice.save()

    audit({
      entityType: 'payment',
      entityId: payment._id,
      action: 'payment_record',
      actorId: (req as any).user?._id,
      actorRole: 'ADMIN',
      meta: {
        invoiceId: String(invoice._id),
        amount: invoice.amount,
        receiptNumber,
      },
    })

    // First-ever recorded payment for this student pays out their referrer.
    const priorPayments = await Payment.countDocuments({
      studentId: invoice.studentId,
      status: 'recorded',
      _id: { $ne: payment._id },
    })
    if (priorPayments === 0) {
      await rewardReferralOnBooking(String(invoice.studentId))
    }

    // Receipt email (the user-facing confirmation) + push — best-effort.
    emailReceipt(invoice, payment).catch(err =>
      console.error('[mail] payment receipt failed:', err.message)
    )
    sendPushToUser(String(invoice.studentId ?? ''), {
      title: 'Payment received',
      body: `We've recorded your payment of ₹${invoice.amount} (${invoice.invoiceNumber}). Receipt emailed.`,
      data: {
        type: 'payment_recorded',
        bookingId: String(invoice.bookingId),
        invoiceId: String(invoice._id),
      },
    }).catch(err => console.error('[push] payment recorded failed:', err.message))

    return res
      .status(200)
      .json({ message: 'Payment recorded', invoice, payment })
  }
)

/**
 * POST /api/invoices/:invoiceId/resend-receipt  (ADMIN)
 */
export const resendReceiptController = catchAsync(
  async (req: Request, res: Response) => {
    const { invoiceId } = req.params
    if (!mongooseIdValidator(invoiceId)) {
      return res.status(400).json({ message: 'Invalid invoiceId' })
    }
    const invoice = await Invoice.findById(invoiceId)
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' })
    }
    const payment = await Payment.findOne({
      invoiceId: invoice._id,
      status: 'recorded',
    })
    if (!payment) {
      return res
        .status(409)
        .json({ message: 'No recorded payment on this invoice yet.' })
    }

    try {
      await emailReceipt(invoice, payment)
    } catch (err: any) {
      return res
        .status(502)
        .json({ message: `Could not send the receipt: ${err.message}` })
    }
    return res.status(200).json({ message: 'Receipt sent', payment })
  }
)

/**
 * POST /api/payments/:paymentId/void  (ADMIN) — { reason }
 * Corrections: voids a recorded payment; a paid (unsettled) invoice returns to
 * payment_due so it can be re-recorded correctly.
 */
export const voidPaymentController = catchAsync(
  async (req: Request, res: Response) => {
    const { paymentId } = req.params
    if (!mongooseIdValidator(paymentId)) {
      return res.status(400).json({ message: 'Invalid paymentId' })
    }
    const payment = await Payment.findById(paymentId)
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' })
    }
    if (payment.status !== 'recorded') {
      return res.status(409).json({ message: 'Payment is already void.' })
    }

    if (payment.invoiceId) {
      const invoice = await Invoice.findById(payment.invoiceId)
      if (invoice?.status === 'settled') {
        return res.status(409).json({
          message: 'This invoice is settled — void the settlement first.',
        })
      }
      if (invoice) {
        invoice.status = 'payment_due'
        invoice.paidAt = null
        invoice.paymentId = null
        await invoice.save()
      }
    }

    const reason =
      typeof req.body?.reason === 'string' ? req.body.reason.trim() : ''
    payment.status = 'void'
    payment.voidReason = reason
    await payment.save()

    audit({
      entityType: 'payment',
      entityId: payment._id,
      action: 'payment_void',
      actorId: (req as any).user?._id,
      actorRole: 'ADMIN',
      meta: reason ? { reason } : undefined,
    })

    return res.status(200).json({ message: 'Payment voided', payment })
  }
)
