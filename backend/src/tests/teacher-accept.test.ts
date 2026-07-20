import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'
import Booking from '../models/Booking'
import Auth from '../models/Auth'
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

async function approvedBooking(s: Awaited<ReturnType<typeof scenario>>) {
  const created = await request(app)
    .post('/api/booking')
    .set('Authorization', s.student.token)
    .send(
      bookingPayload({
        studentId: s.student.id,
        mentorId: s.mentor.id,
        classId: s.classId,
        subjectId: s.subjectId,
        email: s.student.user.email,
      })
    )
  const id = created.body.newBooking._id
  await request(app)
    .patch(`/api/booking/${id}/approve`)
    .set('Authorization', s.admin.token)
  return id as string
}

describe('Teacher accept/decline flow', () => {
  describe('PATCH /api/booking/:id/teacher-accept', () => {
    it('confirms the booking, freezes the rate card and starts billing', async () => {
      const s = await scenario()
      const id = await approvedBooking(s)
      sentMails.length = 0

      const res = await request(app)
        .patch(`/api/booking/${id}/teacher-accept`)
        .set('Authorization', s.mentor.token)
      expect(res.status).toBe(200)

      const b = res.body.booking
      expect(b.bookingStatus).toBe('confirmed')
      expect(b.teacherAcceptedAt).toBeTruthy()
      // Default catalog rates (mentor has no custom fees): subject 500/hr.
      expect(b.pricingSnapshot.source).toBe('default')
      expect(b.pricingSnapshot.subjectRates).toHaveLength(1)
      expect(b.pricingSnapshot.subjectRates[0].hourlyRate).toBe(500)
      // Monthly cycle → first invoice boundary one period after start.
      expect(b.nextDueDate).toBeTruthy()

      expect(sentMails.map(m => m.type)).toContain('teacherAccepted')
    })

    it('uses the mentor rates when custom_fee_enabled', async () => {
      const s = await scenario()
      await Auth.updateOne(
        { _id: s.mentor.id },
        {
          custom_fee_enabled: true,
          selected_class: [
            {
              class_id: s.classId,
              price: 900,
              subject: [{ subject_id: s.subjectId, subject_price: 650 }],
            },
          ],
        }
      )
      const id = await approvedBooking(s)
      const res = await request(app)
        .patch(`/api/booking/${id}/teacher-accept`)
        .set('Authorization', s.mentor.token)
      expect(res.status).toBe(200)
      expect(res.body.booking.pricingSnapshot.source).toBe('custom')
      expect(res.body.booking.pricingSnapshot.subjectRates[0].hourlyRate).toBe(650)
    })

    it('per-session frequency → no calendar boundary (nextDueDate null)', async () => {
      const s = await scenario()
      const created = await request(app)
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
          paymentFrequency: 'per-session',
        })
      const id = created.body.newBooking._id
      await request(app).patch(`/api/booking/${id}/approve`).set('Authorization', s.admin.token)
      const res = await request(app)
        .patch(`/api/booking/${id}/teacher-accept`)
        .set('Authorization', s.mentor.token)
      expect(res.status).toBe(200)
      expect(res.body.booking.nextDueDate).toBeNull()
    })

    it('blocks a different tutor (403) and wrong states (409)', async () => {
      const s = await scenario()
      const otherMentor = await seedMentor()
      const id = await approvedBooking(s)

      const wrongTutor = await request(app)
        .patch(`/api/booking/${id}/teacher-accept`)
        .set('Authorization', otherMentor.token)
      expect(wrongTutor.status).toBe(403)

      // Accept once, then again → 409 (already confirmed).
      await request(app)
        .patch(`/api/booking/${id}/teacher-accept`)
        .set('Authorization', s.mentor.token)
      const again = await request(app)
        .patch(`/api/booking/${id}/teacher-accept`)
        .set('Authorization', s.mentor.token)
      expect(again.status).toBe(409)
    })

    it('cannot accept a booking that is still pending (409)', async () => {
      const s = await scenario()
      const created = await request(app)
        .post('/api/booking')
        .set('Authorization', s.student.token)
        .send(
          bookingPayload({
            studentId: s.student.id,
            mentorId: s.mentor.id,
            classId: s.classId,
            subjectId: s.subjectId,
            email: s.student.user.email,
          })
        )
      const res = await request(app)
        .patch(`/api/booking/${created.body.newBooking._id}/teacher-accept`)
        .set('Authorization', s.mentor.token)
      expect(res.status).toBe(409)
    })
  })

  describe('PATCH /api/booking/:id/teacher-decline', () => {
    it('cancels, stores the reason and notifies the student', async () => {
      const s = await scenario()
      const id = await approvedBooking(s)
      sentMails.length = 0

      const res = await request(app)
        .patch(`/api/booking/${id}/teacher-decline`)
        .set('Authorization', s.mentor.token)
        .send({ reason: 'Schedule full this term' })
      expect(res.status).toBe(200)
      expect(res.body.booking.bookingStatus).toBe('cancelled')
      expect(res.body.booking.teacherDeclineReason).toBe('Schedule full this term')
      expect(sentMails.map(m => m.type)).toContain('teacherDeclined')
    })

    it('frees a reserved 1-on-1 slot so another student can book it', async () => {
      const s = await scenario()
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

      const created = await request(app)
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
          reservedSlots: reserved,
        })
      const id = created.body.newBooking._id
      await request(app).patch(`/api/booking/${id}/approve`).set('Authorization', s.admin.token)
      await request(app)
        .patch(`/api/booking/${id}/teacher-decline`)
        .set('Authorization', s.mentor.token)
        .send({})

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
  })

  describe('GET /api/booking/mentor/requests', () => {
    it('lists only this mentor’s approved bookings', async () => {
      const s = await scenario()
      const id = await approvedBooking(s)
      const otherMentor = await seedMentor()

      const mine = await request(app)
        .get('/api/booking/mentor/requests')
        .set('Authorization', s.mentor.token)
      expect(mine.status).toBe(200)
      expect(mine.body.bookings).toHaveLength(1)
      expect(mine.body.bookings[0]._id).toBe(id)

      const theirs = await request(app)
        .get('/api/booking/mentor/requests')
        .set('Authorization', otherMentor.token)
      expect(theirs.body.bookings).toHaveLength(0)

      const denied = await request(app)
        .get('/api/booking/mentor/requests')
        .set('Authorization', s.student.token)
      expect(denied.status).toBe(403)
    })
  })

  describe('complete / close', () => {
    it('completes a confirmed booking and closes it once nothing is owed', async () => {
      const s = await scenario()
      const id = await approvedBooking(s)
      await request(app)
        .patch(`/api/booking/${id}/teacher-accept`)
        .set('Authorization', s.mentor.token)

      const done = await request(app)
        .patch(`/api/booking/${id}/complete`)
        .set('Authorization', s.admin.token)
      expect(done.status).toBe(200)
      expect(done.body.booking.bookingStatus).toBe('completed')

      // No sessions were billed → nothing owed → close succeeds.
      const closed = await request(app)
        .patch(`/api/booking/${id}/close`)
        .set('Authorization', s.admin.token)
      expect(closed.status).toBe(200)
      expect(closed.body.booking.bookingStatus).toBe('closed')

      const saved = await Booking.findById(id)
      expect(saved!.bookingStatus).toBe('closed')
    })

    it('cannot complete a booking the teacher has not accepted (409)', async () => {
      const s = await scenario()
      const id = await approvedBooking(s)
      const res = await request(app)
        .patch(`/api/booking/${id}/complete`)
        .set('Authorization', s.admin.token)
      expect(res.status).toBe(409)
    })
  })
})
