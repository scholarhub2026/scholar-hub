import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'
import Invoice from '../models/Invoice'
import { sentMails } from './stubs/mailService'
import {
  billingScenario,
  confirmedBooking,
  logSession,
  verifySession,
  type BillingScenario,
} from './billingHelpers'

const app = createApp()

/** One PAID 500₹ invoice for the scenario's mentor. */
async function paidInvoice(s: BillingScenario) {
  const bookingId = await confirmedBooking(app, s, {
    paymentFrequency: 'per-session',
  })
  const logged = await logSession(app, s, bookingId)
  await verifySession(app, s, logged.body.session._id)
  const invoice = await Invoice.findOne({ bookingId, status: 'payment_due' })
  await request(app)
    .post(`/api/invoices/${invoice!._id}/payments`)
    .set('Authorization', s.admin.token)
    .send({})
  return String(invoice!._id)
}

describe('Settlements (mentor payouts, no commission)', () => {
  it('settles paid invoices: settlement recorded, invoices → settled, mentor notified', async () => {
    const s = await billingScenario()
    const inv = await paidInvoice(s)
    sentMails.length = 0

    const res = await request(app)
      .post('/api/settlements')
      .set('Authorization', s.admin.token)
      .send({ mentorId: s.mentor.id, invoiceIds: [inv], method: 'upi', reference: 'UTR123' })
    expect(res.status).toBe(201)
    expect(res.body.settlement.settlementNumber).toMatch(/^SH-STL-/)
    // No commission: default amount = invoice total.
    expect(res.body.settlement.amount).toBe(500)

    const settled = await Invoice.findById(inv)
    expect(settled!.status).toBe('settled')
    expect(String(settled!.settlementId)).toBe(String(res.body.settlement._id))

    expect(sentMails.map(m => m.type)).toContain('settlementRecorded')
  })

  it('accepts a manual amount override (direct admin–mentor arrangement)', async () => {
    const s = await billingScenario()
    const inv = await paidInvoice(s)
    const res = await request(app)
      .post('/api/settlements')
      .set('Authorization', s.admin.token)
      .send({ mentorId: s.mentor.id, invoiceIds: [inv], amount: 450 })
    expect(res.status).toBe(201)
    expect(res.body.settlement.amount).toBe(450)
  })

  it('refuses unpaid or already-settled invoices (409)', async () => {
    const s = await billingScenario()
    // A due (unpaid) invoice:
    const bookingId = await confirmedBooking(app, s, { paymentFrequency: 'per-session' })
    const logged = await logSession(app, s, bookingId)
    await verifySession(app, s, logged.body.session._id)
    const due = await Invoice.findOne({ bookingId })

    const unpaid = await request(app)
      .post('/api/settlements')
      .set('Authorization', s.admin.token)
      .send({ mentorId: s.mentor.id, invoiceIds: [String(due!._id)] })
    expect(unpaid.status).toBe(409)

    // Settle a paid one (fresh student/mentor — the duplicate-booking guard
    // blocks a second active booking for the same pair), then settle it again.
    const s2 = await billingScenario()
    const inv = await paidInvoice(s2)
    await request(app)
      .post('/api/settlements')
      .set('Authorization', s2.admin.token)
      .send({ mentorId: s2.mentor.id, invoiceIds: [inv] })
    const again = await request(app)
      .post('/api/settlements')
      .set('Authorization', s2.admin.token)
      .send({ mentorId: s2.mentor.id, invoiceIds: [inv] })
    expect(again.status).toBe(409)
  })

  it("refuses another mentor's invoices (409)", async () => {
    const s = await billingScenario()
    const other = await billingScenario()
    const inv = await paidInvoice(s)
    const res = await request(app)
      .post('/api/settlements')
      .set('Authorization', s.admin.token)
      .send({ mentorId: other.mentor.id, invoiceIds: [inv] })
    expect(res.status).toBe(409)
  })

  it('mentor sees own payouts; admin list shows pending-by-mentor', async () => {
    const s = await billingScenario()
    const inv = await paidInvoice(s)

    // Before settling: admin sees the mentor's unsettled total.
    const before = await request(app)
      .get('/api/settlements')
      .set('Authorization', s.admin.token)
    const pending = before.body.pendingByMentor.find(
      (p: any) => String(p._id) === s.mentor.id
    )
    expect(pending.total).toBe(500)

    await request(app)
      .post('/api/settlements')
      .set('Authorization', s.admin.token)
      .send({ mentorId: s.mentor.id, invoiceIds: [inv] })

    const mine = await request(app)
      .get('/api/settlements/mentor')
      .set('Authorization', s.mentor.token)
    expect(mine.body.settlements).toHaveLength(1)
    expect(mine.body.totalReceived).toBe(500)

    const denied = await request(app)
      .get('/api/settlements')
      .set('Authorization', s.mentor.token)
    expect(denied.status).toBe(403)
  })

  it('voiding a settlement returns its invoices to paid', async () => {
    const s = await billingScenario()
    const inv = await paidInvoice(s)
    const created = await request(app)
      .post('/api/settlements')
      .set('Authorization', s.admin.token)
      .send({ mentorId: s.mentor.id, invoiceIds: [inv] })

    const res = await request(app)
      .post(`/api/settlements/${created.body.settlement._id}/void`)
      .set('Authorization', s.admin.token)
      .send({ reason: 'Wrong mentor account' })
    expect(res.status).toBe(200)

    const invoice = await Invoice.findById(inv)
    expect(invoice!.status).toBe('paid')
    expect(invoice!.settlementId).toBeNull()
  })
})
