import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'
import Auth from '../models/Auth'
import Invoice from '../models/Invoice'
import Payment from '../models/Payment'
import { sentMails } from './stubs/mailService'
import { seedStudent } from './helpers'
import {
  billingScenario,
  confirmedBooking,
  logSession,
  verifySession,
  type BillingScenario,
} from './billingHelpers'

const app = createApp()

/** Book per-session, log + verify one 1-hour session → one due invoice. */
async function dueInvoice(s: BillingScenario) {
  const bookingId = await confirmedBooking(app, s, {
    paymentFrequency: 'per-session',
  })
  const logged = await logSession(app, s, bookingId)
  await verifySession(app, s, logged.body.session._id)
  const invoice = await Invoice.findOne({ bookingId })
  return { bookingId, invoiceId: String(invoice!._id) }
}

describe('Payments ledger & receipts', () => {
  it('records a payment: invoice paid, ledger entry, receipt emailed', async () => {
    const s = await billingScenario()
    const { invoiceId } = await dueInvoice(s)
    sentMails.length = 0

    const res = await request(app)
      .post(`/api/invoices/${invoiceId}/payments`)
      .set('Authorization', s.admin.token)
      .send({ method: 'upi', note: 'GPay' })
    expect(res.status).toBe(200)
    expect(res.body.invoice.status).toBe('paid')
    expect(res.body.payment.receiptNumber).toMatch(/^SH-RCPT-/)
    expect(res.body.payment.amount).toBe(500)
    expect(res.body.payment.method).toBe('upi')

    // The receipt email went to the student (the user's explicit ask).
    const receiptMail = sentMails.find(m => m.type === 'paymentReceipt')
    expect(receiptMail).toBeTruthy()
    expect(receiptMail!.to).toBe(s.student.user.email)
    expect(receiptMail!.subject).toContain(res.body.payment.receiptNumber)

    const ledger = await Payment.findOne({ invoiceId })
    expect(ledger!.status).toBe('recorded')
    expect(ledger!.receiptEmailedAt).toBeTruthy()
  })

  it('double-record → 409 (one live payment per invoice)', async () => {
    const s = await billingScenario()
    const { invoiceId } = await dueInvoice(s)
    await request(app)
      .post(`/api/invoices/${invoiceId}/payments`)
      .set('Authorization', s.admin.token)
      .send({})
    const again = await request(app)
      .post(`/api/invoices/${invoiceId}/payments`)
      .set('Authorization', s.admin.token)
      .send({})
    expect(again.status).toBe(409)
    expect(await Payment.countDocuments({ invoiceId })).toBe(1)
  })

  it('pays the referrer on the student’s FIRST payment only', async () => {
    const s = await billingScenario()
    const referrer = await seedStudent({ referralCode: 'REF999', rewardBalance: 0 })
    await Auth.updateOne(
      { _id: s.student.id },
      { referredBy: referrer.user._id, referralRewarded: false }
    )

    const first = await dueInvoice(s)
    await request(app)
      .post(`/api/invoices/${first.invoiceId}/payments`)
      .set('Authorization', s.admin.token)
      .send({})
    const afterFirst = (await Auth.findById(referrer.id))!.rewardBalance ?? 0
    expect(afterFirst).toBeGreaterThan(0)

    // Second session → second invoice → second payment: no double payout.
    const logged = await logSession(app, s, first.bookingId, {
      startTime: '20:00',
      endTime: '21:00',
    })
    await verifySession(app, s, logged.body.session._id)
    const second = await Invoice.findOne({
      bookingId: first.bookingId,
      status: 'payment_due',
    })
    await request(app)
      .post(`/api/invoices/${second!._id}/payments`)
      .set('Authorization', s.admin.token)
      .send({})
    expect((await Auth.findById(referrer.id))!.rewardBalance).toBe(afterFirst)
  })

  it('resends the receipt on demand', async () => {
    const s = await billingScenario()
    const { invoiceId } = await dueInvoice(s)
    await request(app)
      .post(`/api/invoices/${invoiceId}/payments`)
      .set('Authorization', s.admin.token)
      .send({})
    sentMails.length = 0

    const res = await request(app)
      .post(`/api/invoices/${invoiceId}/resend-receipt`)
      .set('Authorization', s.admin.token)
    expect(res.status).toBe(200)
    expect(sentMails.map(m => m.type)).toContain('paymentReceipt')
  })

  it('voiding a payment reopens the invoice for a corrected record', async () => {
    const s = await billingScenario()
    const { invoiceId } = await dueInvoice(s)
    const paid = await request(app)
      .post(`/api/invoices/${invoiceId}/payments`)
      .set('Authorization', s.admin.token)
      .send({})
    const paymentId = paid.body.payment._id

    const voided = await request(app)
      .post(`/api/payments/${paymentId}/void`)
      .set('Authorization', s.admin.token)
      .send({ reason: 'Wrong method' })
    expect(voided.status).toBe(200)

    const invoice = await Invoice.findById(invoiceId)
    expect(invoice!.status).toBe('payment_due')

    // Re-record works now (the partial unique index ignores void payments).
    const again = await request(app)
      .post(`/api/invoices/${invoiceId}/payments`)
      .set('Authorization', s.admin.token)
      .send({ method: 'cash' })
    expect(again.status).toBe(200)
  })

  it('ledger entries are append-only (immutability hook)', async () => {
    const s = await billingScenario()
    const { invoiceId } = await dueInvoice(s)
    await request(app)
      .post(`/api/invoices/${invoiceId}/payments`)
      .set('Authorization', s.admin.token)
      .send({})
    const payment = await Payment.findOne({ invoiceId })
    payment!.amount = 1
    await expect(payment!.save()).rejects.toThrow(/immutable/)
  })

  it('receipt numbers are sequential and unique', async () => {
    const s = await billingScenario()
    const first = await dueInvoice(s)
    await request(app)
      .post(`/api/invoices/${first.invoiceId}/payments`)
      .set('Authorization', s.admin.token)
      .send({})

    const s2 = await billingScenario()
    const second = await dueInvoice(s2)
    await request(app)
      .post(`/api/invoices/${second.invoiceId}/payments`)
      .set('Authorization', s2.admin.token)
      .send({})

    const numbers = (await Payment.find().sort({ createdAt: 1 })).map(
      p => p.receiptNumber
    )
    expect(new Set(numbers).size).toBe(numbers.length)
    const seqs = numbers.map(n => parseInt(n.split('-').pop()!, 10))
    expect(seqs[1]).toBe(seqs[0] + 1)
  })
})
