import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'
import Booking from '../models/Booking'
import Invoice from '../models/Invoice'
import Session from '../models/Session'
import { runInvoiceGeneration } from '../jobs/invoiceGenerationJob'
import { sentMails } from './stubs/mailService'
import {
  billingScenario,
  confirmedBooking,
  istDatePlus,
  logSession,
  verifySession,
} from './billingHelpers'

const app = createApp()

/** Pretend `days` days have passed (drives todayIST inside the cron run). */
const nowPlusDays = (days: number) =>
  new Date(Date.now() + days * 86_400_000)

describe('Invoices (metered billing)', () => {
  describe('cycle generation (weekly/monthly cron)', () => {
    it('bills verified sessions of the cycle: #sessions × per-class fee (full)', async () => {
      const s = await billingScenario()
      const bookingId = await confirmedBooking(app, s, {
        bookingType: 'full',
        selectedSubjects: [],
        paymentFrequency: 'weekly',
        classStartDate: istDatePlus(0),
      })
      // Two verified sessions + one left unverified (must NOT bill).
      const a = await logSession(app, s, bookingId, { startTime: '10:00', endTime: '11:00' })
      const b = await logSession(app, s, bookingId, { startTime: '12:00', endTime: '13:30' })
      const c = await logSession(app, s, bookingId, { startTime: '15:00', endTime: '16:00' })
      await verifySession(app, s, a.body.session._id)
      await verifySession(app, s, b.body.session._id)
      void c
      sentMails.length = 0

      const run = await runInvoiceGeneration(nowPlusDays(7))
      expect(run.generated).toBe(1)

      const invoice = await Invoice.findOne({ bookingId })
      // Catalog basePrice '500' × 2 sessions (hours are irrelevant for 'full').
      expect(invoice!.amount).toBe(1000)
      expect(invoice!.status).toBe('payment_due')
      expect(invoice!.lineItems[0].quantity).toBe(2)
      expect(invoice!.lineItems[0].unit).toBe('session')
      expect(invoice!.invoiceNumber).toMatch(/^SH-INV-/)

      // Billed sessions are locked to the invoice; unverified one is not.
      const billed = await Session.find({ bookingId, invoiceId: invoice!._id })
      expect(billed).toHaveLength(2)

      // Boundary advanced one week.
      const booking = await Booking.findById(bookingId)
      expect(booking!.nextDueDate!.getTime()).toBeGreaterThan(Date.now())

      // Student got the invoice notice.
      expect(sentMails.map(m => m.type)).toContain('invoiceGenerated')
    })

    it('bills hourly for individual bookings (completed hours × rate)', async () => {
      const s = await billingScenario()
      const bookingId = await confirmedBooking(app, s, {
        paymentFrequency: 'weekly',
        classStartDate: istDatePlus(0),
      })
      // 90 minutes at catalog 500/hr = 750.
      const a = await logSession(app, s, bookingId, { startTime: '10:00', endTime: '11:30' })
      await verifySession(app, s, a.body.session._id)

      await runInvoiceGeneration(nowPlusDays(7))
      const invoice = await Invoice.findOne({ bookingId })
      expect(invoice!.amount).toBe(750)
      expect(invoice!.lineItems[0].unit).toBe('hour')
      expect(invoice!.lineItems[0].quantity).toBe(1.5)
    })

    it('zero-session cycle: no invoice, boundary advances', async () => {
      const s = await billingScenario()
      const bookingId = await confirmedBooking(app, s, {
        paymentFrequency: 'weekly',
        classStartDate: istDatePlus(0),
      })
      const before = await Booking.findById(bookingId)
      const run = await runInvoiceGeneration(nowPlusDays(7))
      expect(run.empty).toBe(1)
      const after = await Booking.findById(bookingId)
      expect(after!.nextDueDate!.getTime()).toBeGreaterThan(
        before!.nextDueDate!.getTime()
      )
      expect(await Invoice.countDocuments({ bookingId })).toBe(0)
    })

    it('same period never generates twice (periodKey unique)', async () => {
      const s = await billingScenario()
      const bookingId = await confirmedBooking(app, s, {
        paymentFrequency: 'weekly',
        classStartDate: istDatePlus(0),
      })
      const a = await logSession(app, s, bookingId)
      await verifySession(app, s, a.body.session._id)

      await runInvoiceGeneration(nowPlusDays(7))
      // Manually rewind the boundary to simulate a double-run of the same period.
      const invoice = await Invoice.findOne({ bookingId })
      await Booking.updateOne({ _id: bookingId }, { nextDueDate: invoice!.periodEnd })

      const again = await runInvoiceGeneration(nowPlusDays(7))
      expect(again.generated).toBe(0)
      expect(await Invoice.countDocuments({ bookingId })).toBe(1)
    })
  })

  describe('per-session billing (invoice at verify)', () => {
    it('generates one invoice per verified session', async () => {
      const s = await billingScenario()
      const bookingId = await confirmedBooking(app, s, {
        paymentFrequency: 'per-session',
      })
      const a = await logSession(app, s, bookingId, { startTime: '10:00', endTime: '11:00' })
      const res = await verifySession(app, s, a.body.session._id)
      expect(res.status).toBe(200)
      expect(res.body.invoice).toBeTruthy()
      expect(res.body.invoice.amount).toBe(500) // 1h × 500/hr

      const b = await logSession(app, s, bookingId, { startTime: '12:00', endTime: '12:30' })
      const res2 = await verifySession(app, s, b.body.session._id)
      expect(res2.body.invoice.amount).toBe(250) // 0.5h

      expect(await Invoice.countDocuments({ bookingId })).toBe(2)
    })
  })

  describe('POST /api/invoices/generate (on-demand)', () => {
    it('closes the current cycle early', async () => {
      const s = await billingScenario()
      const bookingId = await confirmedBooking(app, s, {
        paymentFrequency: 'monthly',
        classStartDate: istDatePlus(0),
      })
      const a = await logSession(app, s, bookingId)
      await verifySession(app, s, a.body.session._id)

      const res = await request(app)
        .post('/api/invoices/generate')
        .set('Authorization', s.admin.token)
        .send({ bookingId })
      expect(res.status).toBe(201)
      expect(res.body.invoice.amount).toBe(500)
    })

    it('nothing to bill → friendly 200, non-metered → 409', async () => {
      const s = await billingScenario()
      const bookingId = await confirmedBooking(app, s, {
        paymentFrequency: 'monthly',
        classStartDate: istDatePlus(0),
      })
      const res = await request(app)
        .post('/api/invoices/generate')
        .set('Authorization', s.admin.token)
        .send({ bookingId })
      expect(res.status).toBe(200)

      await Booking.updateOne({ _id: bookingId }, { billingMode: 'legacy-flat' })
      const legacy = await request(app)
        .post('/api/invoices/generate')
        .set('Authorization', s.admin.token)
        .send({ bookingId })
      expect(legacy.status).toBe(409)
    })
  })

  describe('void', () => {
    it('voids an unpaid invoice, frees its sessions and period for re-billing', async () => {
      const s = await billingScenario()
      const bookingId = await confirmedBooking(app, s, {
        paymentFrequency: 'weekly',
        classStartDate: istDatePlus(0),
      })
      const a = await logSession(app, s, bookingId)
      await verifySession(app, s, a.body.session._id)
      await runInvoiceGeneration(nowPlusDays(7))
      const invoice = await Invoice.findOne({ bookingId })

      const res = await request(app)
        .post(`/api/invoices/${invoice!._id}/void`)
        .set('Authorization', s.admin.token)
        .send({ reason: 'Wrong hours' })
      expect(res.status).toBe(200)
      expect(res.body.invoice.status).toBe('void')

      const freed = await Session.findById(a.body.session._id)
      expect(freed!.invoiceId).toBeNull()

      // The same period can be regenerated after the void.
      await Booking.updateOne({ _id: bookingId }, { nextDueDate: invoice!.periodEnd })
      const rerun = await runInvoiceGeneration(nowPlusDays(7))
      expect(rerun.generated).toBe(1)
    })

    it('an invoice amount cannot be edited after creation (immutability)', async () => {
      const s = await billingScenario()
      const bookingId = await confirmedBooking(app, s, {
        paymentFrequency: 'weekly',
        classStartDate: istDatePlus(0),
      })
      const a = await logSession(app, s, bookingId)
      await verifySession(app, s, a.body.session._id)
      await runInvoiceGeneration(nowPlusDays(7))

      const invoice = await Invoice.findOne({ bookingId })
      invoice!.amount = 1
      await expect(invoice!.save()).rejects.toThrow(/immutable/)
    })
  })

  describe('access', () => {
    it('student and mentor see their own invoices; admin list has counts', async () => {
      const s = await billingScenario()
      const bookingId = await confirmedBooking(app, s, {
        paymentFrequency: 'per-session',
      })
      const a = await logSession(app, s, bookingId)
      await verifySession(app, s, a.body.session._id)

      const mine = await request(app)
        .get('/api/invoices/mine')
        .set('Authorization', s.student.token)
      expect(mine.status).toBe(200)
      expect(mine.body.invoices).toHaveLength(1)

      const mentorView = await request(app)
        .get('/api/invoices/mentor')
        .set('Authorization', s.mentor.token)
      expect(mentorView.body.invoices).toHaveLength(1)
      expect(mentorView.body.summary.billed).toBe(500)

      const adminList = await request(app)
        .get('/api/invoices?scope=due')
        .set('Authorization', s.admin.token)
      expect(adminList.body.invoices).toHaveLength(1)
      expect(adminList.body.counts.due).toBe(1)

      const denied = await request(app)
        .get('/api/invoices')
        .set('Authorization', s.student.token)
      expect(denied.status).toBe(403)
    })
  })
})
