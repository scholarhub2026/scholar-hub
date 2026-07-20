import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'
import Booking from '../models/Booking'
import Auth from '../models/Auth'
import { runPaymentReminders } from '../jobs/paymentReminderJob'
import { advanceByFrequency, todayIST } from '../utils/paymentSchedule'
import { sentMails } from './stubs/mailService'
import {
  seedStudent,
  seedMentor,
  seedAdmin,
  seedSubject,
  seedClass,
  bookingPayload,
} from './helpers'

const app = createApp()

const dateKeyOf = (d: Date) => d.toISOString().slice(0, 10)

/** "YYYY-MM-DD" n days from today (IST calendar). */
const istDatePlus = (days: number) => {
  const t = todayIST()
  return dateKeyOf(new Date(t.getTime() + days * 86_400_000))
}

async function scenario() {
  const student = await seedStudent()
  const mentor = await seedMentor()
  const admin = await seedAdmin()
  const subject = await seedSubject()
  const cls = await seedClass({ subject })
  return {
    student,
    mentor,
    admin,
    subjectId: String(subject._id),
    classId: String(cls._id),
  }
}

async function createBooking(
  s: Awaited<ReturnType<typeof scenario>>,
  extra: Record<string, unknown> = {}
) {
  const res = await request(app)
    .post('/api/booking')
    .set('Authorization', s.student.token)
    .send({
      ...bookingPayload({
        studentId: s.student.id,
        mentorId: s.mentor.id,
        classId: s.classId,
        subjectId: s.subjectId,
        email: s.student.user.email,
      }),
      ...extra,
    })
  return res
}

/**
 * Put a booking into the state the billing-v2 migration leaves pre-rework
 * bookings in: legacy-flat, already confirmed, with a running due schedule.
 * The old flat-fee mark-paid flow only serves these.
 */
async function makeLegacyConfirmed(
  id: string,
  opts: { start?: string; freq?: 'daily' | 'weekly' | 'monthly' } = {}
) {
  const start = opts.start
    ? new Date(`${opts.start}T00:00:00.000Z`)
    : todayIST()
  const freq = opts.freq ?? 'monthly'
  await Booking.updateOne(
    { _id: id },
    {
      billingMode: 'legacy-flat',
      bookingStatus: 'confirmed',
      approvedAt: new Date(),
      paymentFrequency: freq,
      classStartDate: start,
      nextDueDate: advanceByFrequency(start, freq),
    }
  )
}

describe('Manual payment collection', () => {
  describe('create booking (schedule fields)', () => {
    it('persists paymentFrequency and classStartDate', async () => {
      const s = await scenario()
      const res = await createBooking(s, {
        paymentFrequency: 'weekly',
        classStartDate: istDatePlus(3),
      })
      expect(res.status).toBe(201)
      expect(res.body.newBooking.paymentFrequency).toBe('weekly')
      expect(dateKeyOf(new Date(res.body.newBooking.classStartDate))).toBe(istDatePlus(3))
      expect(res.body.newBooking.bookingStatus).toBe('pending')
    })

    it('defaults paymentFrequency to monthly for old clients', async () => {
      const s = await scenario()
      const res = await createBooking(s)
      expect(res.status).toBe(201)
      expect(res.body.newBooking.paymentFrequency).toBe('monthly')
    })

    it('rejects an unknown paymentFrequency', async () => {
      const s = await scenario()
      const res = await createBooking(s, { paymentFrequency: 'yearly' })
      expect(res.status).toBe(400)
    })

    it('rejects a past classStartDate', async () => {
      const s = await scenario()
      const res = await createBooking(s, { classStartDate: istDatePlus(-2) })
      expect(res.status).toBe(400)
    })

    it('strips client-sent schedule/approval state', async () => {
      const s = await scenario()
      const res = await createBooking(s, {
        bookingStatus: 'confirmed',
        nextDueDate: istDatePlus(1),
        payments: [{ amount: 999 }],
        approvedAt: new Date().toISOString(),
      })
      expect(res.status).toBe(201)
      const saved = await Booking.findById(res.body.newBooking._id)
      expect(saved!.bookingStatus).toBe('pending')
      expect(saved!.nextDueDate).toBeNull()
      expect(saved!.payments).toHaveLength(0)
      expect(saved!.approvedAt).toBeNull()
    })
  })

  describe('PATCH /api/booking/:id/approve', () => {
    it('blocks a student from approving (403)', async () => {
      const s = await scenario()
      const created = await createBooking(s)
      const res = await request(app)
        .patch(`/api/booking/${created.body.newBooking._id}/approve`)
        .set('Authorization', s.student.token)
      expect(res.status).toBe(403)
    })

    it('moves the booking to approved and asks the teacher to accept', async () => {
      const s = await scenario()
      const start = istDatePlus(2)
      const created = await createBooking(s, {
        paymentFrequency: 'monthly',
        classStartDate: start,
      })
      sentMails.length = 0

      const res = await request(app)
        .patch(`/api/booking/${created.body.newBooking._id}/approve`)
        .set('Authorization', s.admin.token)
      expect(res.status).toBe(200)
      expect(res.body.booking.bookingStatus).toBe('approved')
      expect(res.body.booking.approvedAt).toBeTruthy()
      // Billing does NOT start until the teacher accepts.
      expect(res.body.booking.nextDueDate).toBeNull()

      // Teacher got the accept request; student got the "awaiting teacher" note.
      const types = sentMails.map(m => m.type)
      expect(types).toContain('teacherAcceptRequest')
      expect(types).toContain('bookingAwaitingTeacher')
    })

    it('is idempotent-guarded: approving twice → 409', async () => {
      const s = await scenario()
      const created = await createBooking(s)
      const id = created.body.newBooking._id
      await request(app).patch(`/api/booking/${id}/approve`).set('Authorization', s.admin.token)
      const again = await request(app)
        .patch(`/api/booking/${id}/approve`)
        .set('Authorization', s.admin.token)
      expect(again.status).toBe(409)
    })

    it('falls back to createdAt for the start date at teacher-accept', async () => {
      const s = await scenario()
      const created = await createBooking(s) // no classStartDate, no slots
      const id = created.body.newBooking._id
      await request(app).patch(`/api/booking/${id}/approve`).set('Authorization', s.admin.token)
      const res = await request(app)
        .patch(`/api/booking/${id}/teacher-accept`)
        .set('Authorization', s.mentor.token)
      expect(res.status).toBe(200)
      expect(res.body.booking.nextDueDate).toBeTruthy()
      expect(res.body.booking.classStartDate).toBeTruthy()
    })
  })

  describe('PATCH /api/booking/:id/reject', () => {
    it('cancels with a reason and notifies the student', async () => {
      const s = await scenario()
      const created = await createBooking(s)
      sentMails.length = 0

      const res = await request(app)
        .patch(`/api/booking/${created.body.newBooking._id}/reject`)
        .set('Authorization', s.admin.token)
        .send({ reason: 'Mentor unavailable this term' })
      expect(res.status).toBe(200)
      expect(res.body.booking.bookingStatus).toBe('cancelled')
      expect(res.body.booking.rejectionReason).toBe('Mentor unavailable this term')
      expect(sentMails.map(m => m.type)).toContain('bookingRejected')
    })

    it('frees a reserved 1-on-1 slot so it can be booked again', async () => {
      const s = await scenario()
      // Mentor publishes a capacity-1 Monday slot.
      await request(app)
        .put(`/api/mentor/${s.mentor.id}/availability`)
        .set('Authorization', s.mentor.token)
        .send({
          weekly_availability: [
            { dayOfWeek: 1, startTime: '18:00', endTime: '19:00', capacity: 1 },
          ],
        })
      const avail = await request(app).get(`/api/mentor/${s.mentor.id}/availability`)
      const slot = avail.body.slots[0]
      const reserved = [
        {
          slotId: slot._id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          cadence: 'recurring',
        },
      ]

      const first = await createBooking(s, { reservedSlots: reserved })
      expect(first.status).toBe(201)

      await request(app)
        .patch(`/api/booking/${first.body.newBooking._id}/reject`)
        .set('Authorization', s.admin.token)
        .send({})

      // A different student can now book the same 1-on-1 slot.
      const other = await seedStudent()
      const again = await request(app)
        .post('/api/booking')
        .set('Authorization', other.token)
        .send({
          ...bookingPayload({
            studentId: other.id,
            mentorId: s.mentor.id,
            classId: s.classId,
            subjectId: s.subjectId,
            email: other.user.email,
          }),
          reservedSlots: reserved,
        })
      expect(again.status).toBe(201)
    })

    it('rejecting a confirmed booking → 409', async () => {
      const s = await scenario()
      const created = await createBooking(s)
      const id = created.body.newBooking._id
      await request(app).patch(`/api/booking/${id}/approve`).set('Authorization', s.admin.token)
      const res = await request(app)
        .patch(`/api/booking/${id}/reject`)
        .set('Authorization', s.admin.token)
      expect(res.status).toBe(409)
    })
  })

  describe('POST /api/booking/:id/payments (mark paid)', () => {
    it('refuses on a pending booking (409)', async () => {
      const s = await scenario()
      const created = await createBooking(s)
      const res = await request(app)
        .post(`/api/booking/${created.body.newBooking._id}/payments`)
        .set('Authorization', s.admin.token)
        .send({})
      expect(res.status).toBe(409)
    })

    it('refuses on a metered (billing v2) booking — pay via invoice (409)', async () => {
      const s = await scenario()
      const created = await createBooking(s)
      const id = created.body.newBooking._id
      await request(app).patch(`/api/booking/${id}/approve`).set('Authorization', s.admin.token)
      await request(app)
        .patch(`/api/booking/${id}/teacher-accept`)
        .set('Authorization', s.mentor.token)
      const res = await request(app)
        .post(`/api/booking/${id}/payments`)
        .set('Authorization', s.admin.token)
        .send({})
      expect(res.status).toBe(409)
    })

    it('records a payment with the default amount and advances the due date (legacy-flat)', async () => {
      const s = await scenario()
      const start = istDatePlus(1)
      const created = await createBooking(s)
      const id = created.body.newBooking._id
      await makeLegacyConfirmed(id, { start, freq: 'weekly' })
      sentMails.length = 0

      const res = await request(app)
        .post(`/api/booking/${id}/payments`)
        .set('Authorization', s.admin.token)
        .send({ note: 'cash' })
      expect(res.status).toBe(200)

      const b = res.body.booking
      expect(b.payments).toHaveLength(1)
      expect(b.payments[0].amount).toBe(500) // booking totalAmount (flat fee)
      expect(b.payments[0].note).toBe('cash')
      expect(b.payments[0].collectedBy).toBe(s.admin.id)
      expect(b.payments[0].periodLabel).toMatch(/^Week of /)

      // Due advanced exactly one week past the first due.
      const startUtc = new Date(`${start}T00:00:00.000Z`)
      const firstDue = advanceByFrequency(startUtc, 'weekly')
      const secondDue = advanceByFrequency(firstDue, 'weekly')
      expect(dateKeyOf(new Date(b.nextDueDate))).toBe(dateKeyOf(secondDue))
      expect(b.lastReminderAt).toBeNull()

      // Ledger entry + emailed receipt (billing v2).
      expect(res.body.receiptNumber).toMatch(/^SH-RCPT-/)
      expect(sentMails.map(m => m.type)).toContain('paymentReceipt')
    })

    it('pays the referrer on the FIRST payment only', async () => {
      const s = await scenario()
      // A referrer whose code the student used at signup.
      const referrer = await seedStudent({ referralCode: 'REF123', rewardBalance: 0 })
      await Auth.updateOne(
        { _id: s.student.id },
        { referredBy: referrer.user._id, referralRewarded: false }
      )

      const created = await createBooking(s)
      const id = created.body.newBooking._id
      await makeLegacyConfirmed(id)

      await request(app)
        .post(`/api/booking/${id}/payments`)
        .set('Authorization', s.admin.token)
        .send({})
      const afterFirst = await Auth.findById(referrer.id)
      const balanceAfterFirst = afterFirst!.rewardBalance ?? 0
      expect(balanceAfterFirst).toBeGreaterThan(0)

      await request(app)
        .post(`/api/booking/${id}/payments`)
        .set('Authorization', s.admin.token)
        .send({})
      const afterSecond = await Auth.findById(referrer.id)
      expect(afterSecond!.rewardBalance).toBe(balanceAfterFirst) // no double payout
    })

    it('accepts an admin-entered amount override', async () => {
      const s = await scenario()
      const created = await createBooking(s)
      const id = created.body.newBooking._id
      await makeLegacyConfirmed(id)
      const res = await request(app)
        .post(`/api/booking/${id}/payments`)
        .set('Authorization', s.admin.token)
        .send({ amount: 750 })
      expect(res.status).toBe(200)
      expect(res.body.booking.payments[0].amount).toBe(750)
    })
  })

  describe('GET /api/booking/payments/due', () => {
    async function seedDue(s: Awaited<ReturnType<typeof scenario>>, dueOffsetDays: number) {
      const created = await createBooking(s)
      const id = created.body.newBooking._id
      await makeLegacyConfirmed(id)
      const t = todayIST()
      await Booking.updateOne(
        { _id: id },
        { nextDueDate: new Date(t.getTime() + dueOffsetDays * 86_400_000) }
      )
      return id
    }

    it('is not shadowed by GET /:studentId and blocks students', async () => {
      const s = await scenario()
      const ok = await request(app)
        .get('/api/booking/payments/due')
        .set('Authorization', s.admin.token)
      expect(ok.status).toBe(200)
      const denied = await request(app)
        .get('/api/booking/payments/due')
        .set('Authorization', s.student.token)
      expect(denied.status).toBe(403)
    })

    it('scopes overdue / today / upcoming with counts and daysOverdue', async () => {
      const s = await scenario()
      const s2 = await scenario()
      const s3 = await scenario()
      await seedDue(s, -2) // overdue
      await seedDue(s2, 0) // today
      await seedDue(s3, 5) // upcoming

      const all = await request(app)
        .get('/api/booking/payments/due')
        .set('Authorization', s.admin.token)
      expect(all.body.counts).toEqual({ overdue: 1, today: 1, upcoming: 1 })
      expect(all.body.bookings).toHaveLength(3)

      const overdue = await request(app)
        .get('/api/booking/payments/due?scope=overdue')
        .set('Authorization', s.admin.token)
      expect(overdue.body.bookings).toHaveLength(1)
      expect(overdue.body.bookings[0].daysOverdue).toBe(2)
      expect(overdue.body.bookings[0].dueStatus).toBe('overdue')

      const today = await request(app)
        .get('/api/booking/payments/due?scope=today')
        .set('Authorization', s.admin.token)
      expect(today.body.bookings).toHaveLength(1)
      expect(today.body.bookings[0].dueStatus).toBe('today')

      const upcoming = await request(app)
        .get('/api/booking/payments/due?scope=upcoming')
        .set('Authorization', s.admin.token)
      expect(upcoming.body.bookings).toHaveLength(1)
      expect(upcoming.body.bookings[0].dueStatus).toBe('upcoming')
    })
  })

  describe('runPaymentReminders', () => {
    async function confirmedWithDue(dueOffsetDays: number) {
      const s = await scenario()
      const created = await createBooking(s)
      const id = created.body.newBooking._id
      await makeLegacyConfirmed(id)
      const t = todayIST()
      await Booking.updateOne(
        { _id: id },
        { nextDueDate: new Date(t.getTime() + dueOffsetDays * 86_400_000) }
      )
      return { s, id }
    }

    it('reminds due + overdue bookings and sends one admin digest', async () => {
      await confirmedWithDue(0) // due today
      await confirmedWithDue(-3) // overdue
      await confirmedWithDue(7) // future — must NOT remind
      sentMails.length = 0

      const { reminded } = await runPaymentReminders()
      expect(reminded).toBe(2)

      const types = sentMails.map(m => m.type)
      expect(types.filter(t => t === 'paymentReminder')).toHaveLength(2)
      // one digest per admin (3 scenarios seeded 3 admins)
      expect(types.filter(t => t === 'paymentDueDigest').length).toBeGreaterThan(0)
    })

    it('dedups within 12h and re-reminds the next day', async () => {
      await confirmedWithDue(-1)
      const first = await runPaymentReminders()
      expect(first.reminded).toBe(1)

      const secondSameDay = await runPaymentReminders()
      expect(secondSameDay.reminded).toBe(0)

      const tomorrow = new Date(Date.now() + 24 * 3600_000)
      const nextDay = await runPaymentReminders(tomorrow)
      expect(nextDay.reminded).toBe(1)
    })

    it('does not remind cancelled or pending bookings', async () => {
      const { s, id } = await confirmedWithDue(-1)
      await request(app)
        .patch(`/api/booking/${id}/cancel`)
        .set('Authorization', s.student.token)
      const { reminded } = await runPaymentReminders()
      expect(reminded).toBe(0)
    })
  })
})
