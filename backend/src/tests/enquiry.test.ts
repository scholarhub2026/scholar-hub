import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'
import Booking from '../models/Booking'
import Enquiry from '../models/Enquiry'
import { advanceByFrequency, todayIST } from '../utils/paymentSchedule'
import { sentMails } from './stubs/mailService'
import { seedStudent, seedMentor, seedAdmin, seedSubject, seedClass } from './helpers'

const app = createApp()

const dateKeyOf = (d: Date) => d.toISOString().slice(0, 10)
const istDatePlus = (days: number) =>
  dateKeyOf(new Date(todayIST().getTime() + days * 86_400_000))

async function scenario() {
  const admin = await seedAdmin()
  const mentor = await seedMentor()
  const subject = await seedSubject()
  const cls = await seedClass({ subject })
  return { admin, mentor, subjectId: String(subject._id), classId: String(cls._id) }
}

describe('Class enquiries', () => {
  describe('POST /api/enquiry (public lead form)', () => {
    it('saves a subject-wise enquiry, sums the fee and emails admins', async () => {
      const s = await scenario()
      await seedAdmin() // a second admin — both should be emailed
      sentMails.length = 0

      const res = await request(app)
        .post('/api/enquiry')
        .send({
          studentName: 'Riya',
          email: 'riya@test.com',
          phone: '9998887776',
          mentorId: s.mentor.id,
          selectedSyllabus: 'cbse',
          classId: s.classId,
          className: 'X',
          enquiryType: 'subject-wise',
          subjects: [{ subjectId: s.subjectId, name: 'maths', price: 500 }],
          message: 'Evenings preferred',
        })
      expect(res.status).toBe(201)
      expect(res.body.enquiry.estimatedAmount).toBe(500)
      expect(res.body.enquiry.status).toBe('new')
      expect(res.body.enquiry.mentorName).toBeTruthy()

      const enquiryMails = sentMails.filter((m) => m.type === 'classEnquiry')
      expect(enquiryMails.length).toBe(2) // one per admin
    })

    it('demo enquiry is free regardless of subjects', async () => {
      const s = await scenario()
      const res = await request(app)
        .post('/api/enquiry')
        .send({
          studentName: 'Sam',
          email: 'sam@test.com',
          phone: '9000000000',
          mentorId: s.mentor.id,
          enquiryType: 'demo',
          subjects: [{ name: 'maths', price: 999 }],
        })
      expect(res.status).toBe(201)
      expect(res.body.enquiry.estimatedAmount).toBe(0)
    })

    it('is public (no auth) but validates required fields + mentor', async () => {
      const s = await scenario()
      const missing = await request(app).post('/api/enquiry').send({ studentName: 'x' })
      expect(missing.status).toBe(400)

      const badType = await request(app).post('/api/enquiry').send({
        studentName: 'x',
        email: 'x@test.com',
        phone: '9',
        mentorId: s.mentor.id,
        enquiryType: 'weird',
      })
      expect(badType.status).toBe(400)
    })
  })

  describe('GET /api/enquiry + PATCH status (admin)', () => {
    it('lists with status counts and gates non-admins', async () => {
      const s = await scenario()
      await request(app).post('/api/enquiry').send({
        studentName: 'A',
        email: 'a@test.com',
        phone: '9',
        mentorId: s.mentor.id,
        enquiryType: 'demo',
      })

      const denied = await request(app).get('/api/enquiry')
      expect(denied.status).toBe(401)

      const list = await request(app)
        .get('/api/enquiry')
        .set('Authorization', s.admin.token)
      expect(list.status).toBe(200)
      expect(list.body.enquiries).toHaveLength(1)
      expect(list.body.counts.new).toBe(1)

      const id = list.body.enquiries[0]._id
      const patched = await request(app)
        .patch(`/api/enquiry/${id}`)
        .set('Authorization', s.admin.token)
        .send({ status: 'contacted' })
      expect(patched.status).toBe(200)
      expect(patched.body.enquiry.status).toBe('contacted')
    })
  })

  describe('POST /api/booking/admin (admin creates confirmed flat booking)', () => {
    it('creates a confirmed legacy-flat booking with a due date and converts the enquiry', async () => {
      const s = await scenario()
      const enq = await request(app).post('/api/enquiry').send({
        studentName: 'Nina',
        email: 'nina@test.com',
        phone: '9111111111',
        mentorId: s.mentor.id,
        enquiryType: 'subject-wise',
        classId: s.classId,
        className: 'X',
        subjects: [{ subjectId: s.subjectId, name: 'maths', price: 800 }],
      })
      const enquiryId = enq.body.enquiry._id
      const start = istDatePlus(2)

      const res = await request(app)
        .post('/api/booking/admin')
        .set('Authorization', s.admin.token)
        .send({
          enquiryId,
          studentName: 'Nina',
          email: 'nina@test.com',
          phone: '9111111111',
          mentorId: s.mentor.id,
          classId: s.classId,
          className: 'X',
          selectedSyllabus: 'cbse',
          subjects: [{ subjectId: s.subjectId, name: 'maths', price: 800 }],
          bookingType: 'subject-wise',
          totalAmount: 800,
          paymentFrequency: 'monthly',
          classStartDate: start,
        })
      expect(res.status).toBe(201)
      const b = res.body.booking
      expect(b.bookingStatus).toBe('confirmed')
      expect(b.billingMode).toBe('legacy-flat')
      expect(b.totalAmount).toBe(800)
      const expectedDue = advanceByFrequency(new Date(`${start}T00:00:00.000Z`), 'monthly')
      expect(dateKeyOf(new Date(b.nextDueDate))).toBe(dateKeyOf(expectedDue))

      const enquiry = await Enquiry.findById(enquiryId)
      expect(enquiry!.status).toBe('converted')
      expect(String(enquiry!.bookingId)).toBe(b._id)

      // The booking now appears in the legacy due-payments list and can be paid.
      const due = await request(app)
        .get('/api/booking/payments/due')
        .set('Authorization', s.admin.token)
      expect(due.body.bookings.some((x: any) => x._id === b._id)).toBe(true)

      const pay = await request(app)
        .post(`/api/booking/${b._id}/payments`)
        .set('Authorization', s.admin.token)
        .send({ note: 'cash' })
      expect(pay.status).toBe(200)
    })

    it('auto-creates a student account for a new email', async () => {
      const s = await scenario()
      const res = await request(app)
        .post('/api/booking/admin')
        .set('Authorization', s.admin.token)
        .send({
          studentName: 'Fresh Student',
          email: 'fresh@test.com',
          phone: '9222222222',
          mentorId: s.mentor.id,
          bookingType: 'demo',
          totalAmount: 0,
          paymentFrequency: 'monthly',
          classStartDate: istDatePlus(1),
        })
      expect(res.status).toBe(201)
      const saved = await Booking.findById(res.body.booking._id)
      expect(saved!.studentId).toBeTruthy()
    })

    it('blocks non-admins and validates required fields', async () => {
      const s = await scenario()
      const student = await seedStudent()
      const denied = await request(app)
        .post('/api/booking/admin')
        .set('Authorization', student.token)
        .send({})
      expect(denied.status).toBe(403)

      const bad = await request(app)
        .post('/api/booking/admin')
        .set('Authorization', s.admin.token)
        .send({ studentName: 'x' })
      expect(bad.status).toBe(400)
    })
  })
})
