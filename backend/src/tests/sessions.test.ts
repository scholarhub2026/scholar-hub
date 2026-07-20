import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'
import Classes from '../models/Classes'
import Session from '../models/Session'
import { seedMentor, seedSubject, bookingPayload } from './helpers'
import {
  billingScenario,
  confirmedBooking,
  istDatePlus,
  logSession,
  verifySession,
} from './billingHelpers'

const app = createApp()

describe('Sessions & attendance', () => {
  describe('POST /api/sessions (mentor logs)', () => {
    it('logs a session on an own confirmed booking', async () => {
      const s = await billingScenario()
      const bookingId = await confirmedBooking(app, s)
      const res = await logSession(app, s, bookingId, { notes: 'algebra' })
      expect(res.status).toBe(201)
      expect(res.body.session.status).toBe('logged')
      expect(res.body.session.durationMinutes).toBe(60)
      expect(res.body.session.notes).toBe('algebra')
      // Individual booking → subject is implicit from the booking.
      expect(String(res.body.session.subjectId)).toBe(s.subjectId)
    })

    it('rejects logging on a booking that is not confirmed (409)', async () => {
      const s = await billingScenario()
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
      const res = await logSession(app, s, created.body.newBooking._id)
      expect(res.status).toBe(409)
    })

    it("blocks another mentor from logging on someone else's booking (403)", async () => {
      const s = await billingScenario()
      const bookingId = await confirmedBooking(app, s)
      const other = await seedMentor()
      const res = await request(app)
        .post('/api/sessions')
        .set('Authorization', other.token)
        .send({
          bookingId,
          date: istDatePlus(0),
          startTime: '18:00',
          endTime: '19:00',
        })
      expect(res.status).toBe(403)
    })

    it('duplicate date+start on the same booking → 409 (unique index)', async () => {
      const s = await billingScenario()
      const bookingId = await confirmedBooking(app, s)
      const first = await logSession(app, s, bookingId)
      expect(first.status).toBe(201)
      const dup = await logSession(app, s, bookingId)
      expect(dup.status).toBe(409)
    })

    it('multiple-subject booking requires a subjectId from the booking', async () => {
      const s = await billingScenario()
      const other = await seedSubject('science')
      await Classes.findByIdAndUpdate(s.classId, {
        $push: { subjects: { subjectId: other._id, price: 400 } },
      })
      const bookingId = await confirmedBooking(app, s, {
        bookingType: 'multiple',
        selectedSubjects: [s.subjectId, String(other._id)],
      })

      const noSubject = await logSession(app, s, bookingId)
      expect(noSubject.status).toBe(400)

      const outsider = await seedSubject('history')
      const wrongSubject = await logSession(app, s, bookingId, {
        subjectId: String(outsider._id),
      })
      expect(wrongSubject.status).toBe(400)

      const ok = await logSession(app, s, bookingId, { subjectId: s.subjectId })
      expect(ok.status).toBe(201)
    })

    it('validates times', async () => {
      const s = await billingScenario()
      const bookingId = await confirmedBooking(app, s)
      const badTime = await logSession(app, s, bookingId, {
        startTime: '19:00',
        endTime: '18:00',
      })
      expect(badTime.status).toBe(400)
      const badFormat = await logSession(app, s, bookingId, {
        startTime: '6pm',
        endTime: '7pm',
      })
      expect(badFormat.status).toBe(400)
    })
  })

  describe('verify / reject (admin)', () => {
    it('verifies a logged session and notifies the mentor', async () => {
      const s = await billingScenario()
      const bookingId = await confirmedBooking(app, s)
      const logged = await logSession(app, s, bookingId)
      const res = await verifySession(app, s, logged.body.session._id)
      expect(res.status).toBe(200)
      expect(res.body.session.status).toBe('verified')
      expect(res.body.session.verifiedBy).toBe(s.admin.id)
    })

    it('rejects with a reason; only logged sessions can be verified/rejected', async () => {
      const s = await billingScenario()
      const bookingId = await confirmedBooking(app, s)
      const logged = await logSession(app, s, bookingId)
      const id = logged.body.session._id

      const rejected = await request(app)
        .patch(`/api/sessions/${id}/reject`)
        .set('Authorization', s.admin.token)
        .send({ reason: 'No class happened that day' })
      expect(rejected.status).toBe(200)
      expect(rejected.body.session.status).toBe('rejected')
      expect(rejected.body.session.rejectReason).toBe('No class happened that day')

      const verifyAfter = await verifySession(app, s, id)
      expect(verifyAfter.status).toBe(409)
    })

    it('blocks a mentor from verifying (403)', async () => {
      const s = await billingScenario()
      const bookingId = await confirmedBooking(app, s)
      const logged = await logSession(app, s, bookingId)
      const res = await request(app)
        .patch(`/api/sessions/${logged.body.session._id}/verify`)
        .set('Authorization', s.mentor.token)
      expect(res.status).toBe(403)
    })
  })

  describe('edit / delete rules', () => {
    it('mentor can edit while logged; edits blocked after verification', async () => {
      const s = await billingScenario()
      const bookingId = await confirmedBooking(app, s)
      const logged = await logSession(app, s, bookingId)
      const id = logged.body.session._id

      const edit = await request(app)
        .patch(`/api/sessions/${id}`)
        .set('Authorization', s.mentor.token)
        .send({ endTime: '19:30' })
      expect(edit.status).toBe(200)
      expect(edit.body.session.durationMinutes).toBe(90)

      await verifySession(app, s, id)
      const editAfter = await request(app)
        .patch(`/api/sessions/${id}`)
        .set('Authorization', s.mentor.token)
        .send({ endTime: '20:00' })
      expect(editAfter.status).toBe(409)
    })

    it('mentor can delete while logged, not after verification', async () => {
      const s = await billingScenario()
      const bookingId = await confirmedBooking(app, s)
      const one = await logSession(app, s, bookingId)
      const del = await request(app)
        .delete(`/api/sessions/${one.body.session._id}`)
        .set('Authorization', s.mentor.token)
      expect(del.status).toBe(200)

      const two = await logSession(app, s, bookingId, { startTime: '20:00', endTime: '21:00' })
      await verifySession(app, s, two.body.session._id)
      const delAfter = await request(app)
        .delete(`/api/sessions/${two.body.session._id}`)
        .set('Authorization', s.mentor.token)
      expect(delAfter.status).toBe(409)
    })
  })

  describe('GET /api/sessions (role-filtered)', () => {
    it('mentor sees own; student sees own; admin sees all + queue count', async () => {
      const s = await billingScenario()
      const bookingId = await confirmedBooking(app, s)
      await logSession(app, s, bookingId)
      await logSession(app, s, bookingId, { startTime: '20:00', endTime: '21:00' })

      const mine = await request(app)
        .get('/api/sessions')
        .set('Authorization', s.mentor.token)
      expect(mine.body.sessions).toHaveLength(2)

      const student = await request(app)
        .get('/api/sessions')
        .set('Authorization', s.student.token)
      expect(student.body.sessions).toHaveLength(2)

      const admin = await request(app)
        .get('/api/sessions?status=logged')
        .set('Authorization', s.admin.token)
      expect(admin.body.sessions).toHaveLength(2)
      expect(admin.body.counts.logged).toBe(2)

      const otherMentor = await seedMentor()
      const empty = await request(app)
        .get('/api/sessions')
        .set('Authorization', otherMentor.token)
      expect(empty.body.sessions).toHaveLength(0)
    })
  })

  it('billed sessions are locked (immutability hook)', async () => {
    const s = await billingScenario()
    const bookingId = await confirmedBooking(app, s)
    const logged = await logSession(app, s, bookingId)
    await verifySession(app, s, logged.body.session._id)

    // Simulate billing: stamp an invoiceId, then try to mutate via save().
    const session = await Session.findById(logged.body.session._id)
    session!.invoiceId = session!._id as any // any ObjectId works for the lock
    await session!.save()

    const again = await Session.findById(session!._id)
    again!.notes = 'tamper'
    await expect(again!.save()).rejects.toThrow(/billed/)
  })
})
