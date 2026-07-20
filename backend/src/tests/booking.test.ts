import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'
import Classes from '../models/Classes'
import {
  seedStudent,
  seedMentor,
  seedAdmin,
  seedSubject,
  seedClass,
  bookingPayload,
  bearer,
} from './helpers'

const app = createApp()

// Set up a student (matching the booking email), a mentor, a class + subject.
async function scenario(email = 'student@test.com') {
  const student = await seedStudent({ email })
  const mentor = await seedMentor()
  const subject = await seedSubject()
  const cls = await seedClass({ subject })
  return {
    student,
    mentor,
    subjectId: String(subject._id),
    classId: String(cls._id),
    email,
  }
}

describe('Booking flow', () => {
  describe('POST /api/booking (create)', () => {
    it('creates a paid booking (pending) for a student', async () => {
      const { student, mentor, subjectId, classId, email } = await scenario()
      const res = await request(app)
        .post('/api/booking')
        .set('Authorization', student.token)
        .send(bookingPayload({ studentId: student.id, mentorId: mentor.id, classId, subjectId, email }))
      expect(res.status).toBe(201)
      expect(res.body.newBooking).toBeTruthy()
      expect(res.body.newBooking.paymentStatus).toBe('pending')
    })

    it('ignores client-sent totalAmount and stores the server estimate', async () => {
      const { student, mentor, subjectId, classId, email } = await scenario()
      const res = await request(app)
        .post('/api/booking')
        .set('Authorization', student.token)
        .send(
          bookingPayload({ studentId: student.id, mentorId: mentor.id, classId, subjectId, email, totalAmount: 0 })
        )
      expect(res.status).toBe(201)
      // Catalog rate for the subject is 500/hr — the client's 0 is not trusted.
      expect(res.body.newBooking.totalAmount).toBe(500)
      expect(res.body.newBooking.billingMode).toBe('metered')
    })

    it('rejects missing required fields', async () => {
      const { student } = await scenario()
      const res = await request(app)
        .post('/api/booking')
        .set('Authorization', student.token)
        .send({ studentName: 'x' })
      expect(res.status).toBe(400)
    })

    it('blocks a non-student (mentor) from booking', async () => {
      const mentor = await seedMentor()
      const res = await request(app)
        .post('/api/booking')
        .set('Authorization', mentor.token)
        .send(bookingPayload({ studentId: mentor.id, mentorId: mentor.id }))
      expect(res.status).toBe(403)
    })

    it('blocks a duplicate pending booking for same mentor + subject (409)', async () => {
      const { student, mentor, subjectId, classId, email } = await scenario()
      const payload = bookingPayload({ studentId: student.id, mentorId: mentor.id, classId, subjectId, email })
      const first = await request(app).post('/api/booking').set('Authorization', student.token).send(payload)
      expect(first.status).toBe(201)
      const dup = await request(app).post('/api/booking').set('Authorization', student.token).send(payload)
      expect(dup.status).toBe(409)
    })

    it('allows re-booking the same subject after cancelling the pending one', async () => {
      const { student, mentor, subjectId, classId, email } = await scenario()
      const payload = bookingPayload({ studentId: student.id, mentorId: mentor.id, classId, subjectId, email })
      const first = await request(app).post('/api/booking').set('Authorization', student.token).send(payload)
      const bookingId = first.body.newBooking._id
      await request(app).patch(`/api/booking/${bookingId}/cancel`).set('Authorization', student.token)
      const again = await request(app).post('/api/booking').set('Authorization', student.token).send(payload)
      expect(again.status).toBe(201)
    })

    it('allows booking a DIFFERENT subject with the same mentor', async () => {
      const { student, mentor, subjectId, classId, email } = await scenario()
      const other = await seedSubject('science')
      // The new subject must have a catalog fee for server-side pricing.
      await Classes.findByIdAndUpdate(classId, {
        $push: { subjects: { subjectId: other._id, price: 400 } },
      })
      await request(app)
        .post('/api/booking')
        .set('Authorization', student.token)
        .send(bookingPayload({ studentId: student.id, mentorId: mentor.id, classId, subjectId, email }))
      const res = await request(app)
        .post('/api/booking')
        .set('Authorization', student.token)
        .send(bookingPayload({ studentId: student.id, mentorId: mentor.id, classId, subjectId: String(other._id), email }))
      expect(res.status).toBe(201)
    })
  })

  describe('PUT /api/booking/:id (update / payment)', () => {
    it('marks a booking paid (completed)', async () => {
      const { student, mentor, subjectId, classId, email } = await scenario()
      const created = await request(app)
        .post('/api/booking')
        .set('Authorization', student.token)
        .send(bookingPayload({ studentId: student.id, mentorId: mentor.id, classId, subjectId, email }))
      const bookingId = created.body.newBooking._id
      const res = await request(app)
        .put(`/api/booking/${bookingId}`)
        .set('Authorization', student.token)
        .send({ paymentStatus: 'completed', bookingStatus: 'confirmed', transactionId: 'pay_123' })
      expect(res.status).toBe(200)
      expect(res.body.updatedBooking.paymentStatus).toBe('completed')
    })

    it('404s on an unknown booking id', async () => {
      const { student } = await scenario()
      const res = await request(app)
        .put('/api/booking/64b64b64b64b64b64b64b64b')
        .set('Authorization', student.token)
        .send({ paymentStatus: 'completed' })
      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /api/booking/:id/cancel', () => {
    async function makeBooking() {
      const s = await scenario()
      const created = await request(app)
        .post('/api/booking')
        .set('Authorization', s.student.token)
        .send(bookingPayload({ studentId: s.student.id, mentorId: s.mentor.id, classId: s.classId, subjectId: s.subjectId, email: s.email }))
      return { ...s, bookingId: created.body.newBooking._id }
    }

    it('lets the owning student cancel a pending booking', async () => {
      const { student, bookingId } = await makeBooking()
      const res = await request(app)
        .patch(`/api/booking/${bookingId}/cancel`)
        .set('Authorization', student.token)
      expect(res.status).toBe(200)
      expect(res.body.booking.bookingStatus).toBe('cancelled')
    })

    it('lets an admin cancel any booking', async () => {
      const { bookingId } = await makeBooking()
      const admin = await seedAdmin()
      const res = await request(app)
        .patch(`/api/booking/${bookingId}/cancel`)
        .set('Authorization', admin.token)
      expect(res.status).toBe(200)
    })

    it('blocks a different student from cancelling (403)', async () => {
      const { bookingId } = await makeBooking()
      const other = await seedStudent()
      const res = await request(app)
        .patch(`/api/booking/${bookingId}/cancel`)
        .set('Authorization', other.token)
      expect(res.status).toBe(403)
    })

    it('refuses to cancel a paid booking (400)', async () => {
      const { student, bookingId } = await makeBooking()
      await request(app)
        .put(`/api/booking/${bookingId}`)
        .set('Authorization', student.token)
        .send({ paymentStatus: 'completed' })
      const res = await request(app)
        .patch(`/api/booking/${bookingId}/cancel`)
        .set('Authorization', student.token)
      expect(res.status).toBe(400)
    })
  })

  describe('DELETE /api/booking/:id (admin)', () => {
    it('lets an admin delete a booking', async () => {
      const s = await scenario()
      const created = await request(app)
        .post('/api/booking')
        .set('Authorization', s.student.token)
        .send(bookingPayload({ studentId: s.student.id, mentorId: s.mentor.id, classId: s.classId, subjectId: s.subjectId, email: s.email }))
      const admin = await seedAdmin()
      const res = await request(app)
        .delete(`/api/booking/${created.body.newBooking._id}`)
        .set('Authorization', admin.token)
      expect(res.status).toBe(200)
    })

    it('blocks a student from deleting (403)', async () => {
      const s = await scenario()
      const created = await request(app)
        .post('/api/booking')
        .set('Authorization', s.student.token)
        .send(bookingPayload({ studentId: s.student.id, mentorId: s.mentor.id, classId: s.classId, subjectId: s.subjectId, email: s.email }))
      const res = await request(app)
        .delete(`/api/booking/${created.body.newBooking._id}`)
        .set('Authorization', s.student.token)
      expect(res.status).toBe(403)
    })
  })

  describe('GET /api/booking/:studentId (list)', () => {
    it("returns a student's own bookings", async () => {
      const s = await scenario()
      await request(app)
        .post('/api/booking')
        .set('Authorization', s.student.token)
        .send(bookingPayload({ studentId: s.student.id, mentorId: s.mentor.id, classId: s.classId, subjectId: s.subjectId, email: s.email }))
      const res = await request(app)
        .get(`/api/booking/${s.student.id}`)
        .set('Authorization', s.student.token)
      expect(res.status).toBe(200)
      expect(res.body.bookings.length).toBeGreaterThan(0)
    })

    it('returns 202 when a student has no bookings', async () => {
      const student = await seedStudent()
      const res = await request(app)
        .get(`/api/booking/${student.id}`)
        .set('Authorization', student.token)
      expect(res.status).toBe(202)
    })
  })

  describe('GET /api/booking/mentor/:mentorId/earnings', () => {
    it('returns an earnings summary for the mentor', async () => {
      const mentor = await seedMentor()
      const res = await request(app)
        .get(`/api/booking/mentor/${mentor.id}/earnings`)
        .set('Authorization', mentor.token)
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('totalEarnings')
    })
  })

  describe('POST /api/booking/create-payment-link', () => {
    it('creates a Razorpay payment link', async () => {
      const student = await seedStudent()
      const res = await request(app)
        .post('/api/booking/create-payment-link')
        .set('Authorization', student.token)
        .send({ amount: 500, name: 'A', email: 'a@test.com', contact: '9999999999', orderId: 'ord_1' })
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
    })
  })

  describe('POST /api/booking/razorpay/webhook', () => {
    it('rejects an invalid signature (400)', async () => {
      const res = await request(app)
        .post('/api/booking/razorpay/webhook')
        .set('x-razorpay-signature', 'bogus')
        .send({ event: 'payment.captured' })
      expect(res.status).toBe(400)
    })
  })
})
