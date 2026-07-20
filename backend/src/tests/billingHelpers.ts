import request from 'supertest'
import type { Express } from 'express'
import { todayIST } from '../utils/paymentSchedule'
import {
  seedStudent,
  seedMentor,
  seedAdmin,
  seedSubject,
  seedClass,
  bookingPayload,
} from './helpers'

export const dateKeyOf = (d: Date) => d.toISOString().slice(0, 10)

/** "YYYY-MM-DD" n days from today (IST calendar). */
export const istDatePlus = (days: number) => {
  const t = todayIST()
  return dateKeyOf(new Date(t.getTime() + days * 86_400_000))
}

export async function billingScenario() {
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
export type BillingScenario = Awaited<ReturnType<typeof billingScenario>>

/** Full happy path to a CONFIRMED metered booking: create → approve → accept. */
export async function confirmedBooking(
  app: Express,
  s: BillingScenario,
  extra: Record<string, unknown> = {}
): Promise<string> {
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
      ...extra,
    })
  const id = created.body.newBooking._id as string
  await request(app)
    .patch(`/api/booking/${id}/approve`)
    .set('Authorization', s.admin.token)
  await request(app)
    .patch(`/api/booking/${id}/teacher-accept`)
    .set('Authorization', s.mentor.token)
  return id
}

/** Mentor logs a session; returns the session id. */
export async function logSession(
  app: Express,
  s: BillingScenario,
  bookingId: string,
  opts: {
    date?: string
    startTime?: string
    endTime?: string
    subjectId?: string
    notes?: string
  } = {}
) {
  const res = await request(app)
    .post('/api/sessions')
    .set('Authorization', s.mentor.token)
    .send({
      bookingId,
      date: opts.date ?? istDatePlus(0),
      startTime: opts.startTime ?? '18:00',
      endTime: opts.endTime ?? '19:00',
      subjectId: opts.subjectId,
      notes: opts.notes,
    })
  return res
}

/** Admin verifies a session. */
export async function verifySession(
  app: Express,
  s: BillingScenario,
  sessionId: string
) {
  return request(app)
    .patch(`/api/sessions/${sessionId}/verify`)
    .set('Authorization', s.admin.token)
}
