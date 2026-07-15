import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'
import { seedAdmin, seedStudent, seedMentor } from './helpers'
import Booking from '../models/Booking'

const app = createApp()

// A review requires that a booking exists between the student and mentor.
async function bookedPair() {
  const student = await seedStudent()
  const mentor = await seedMentor()
  await Booking.create({
    studentId: student.id,
    mentorId: mentor.id,
    studentName: 'Test',
    email: 'r@test.com',
    phone: '9999999999',
    totalAmount: 0,
    bookingType: 'individual',
    selectedClass: { class_id: { class: 'X', syllabus: 'cbse' }, price: 0, subject: [] },
  })
  return { student, mentor }
}

describe('Review flow', () => {
  it('lets a student review a mentor they booked', async () => {
    const { student, mentor } = await bookedPair()
    const res = await request(app)
      .post('/api/review')
      .set('Authorization', student.token)
      .send({ studentId: student.id, mentorId: mentor.id, rating: 5, comment: 'Great' })
    expect(res.status).toBe(201)
    expect(res.body.mentorRating.average).toBeGreaterThan(0)
  })

  it('rejects a rating outside 1–5', async () => {
    const { student, mentor } = await bookedPair()
    const res = await request(app)
      .post('/api/review')
      .set('Authorization', student.token)
      .send({ studentId: student.id, mentorId: mentor.id, rating: 6 })
    expect(res.status).toBe(400)
  })

  it('blocks a review without a prior booking (403)', async () => {
    const student = await seedStudent()
    const mentor = await seedMentor()
    const res = await request(app)
      .post('/api/review')
      .set('Authorization', student.token)
      .send({ studentId: student.id, mentorId: mentor.id, rating: 4 })
    expect(res.status).toBe(403)
  })

  it('upserts — a second review updates rather than duplicates', async () => {
    const { student, mentor } = await bookedPair()
    await request(app).post('/api/review').set('Authorization', student.token)
      .send({ studentId: student.id, mentorId: mentor.id, rating: 3 })
    const res = await request(app).post('/api/review').set('Authorization', student.token)
      .send({ studentId: student.id, mentorId: mentor.id, rating: 5 })
    expect(res.status).toBe(201)
    expect(res.body.mentorRating.count).toBe(1)
  })

  it('returns public mentor reviews', async () => {
    const { student, mentor } = await bookedPair()
    await request(app).post('/api/review').set('Authorization', student.token)
      .send({ studentId: student.id, mentorId: mentor.id, rating: 4 })
    const res = await request(app).get(`/api/review/mentor/${mentor.id}`)
    expect(res.status).toBe(200)
    expect(res.body.count).toBe(1)
  })

  it('lets an admin list all reviews', async () => {
    const admin = await seedAdmin()
    const res = await request(app).get('/api/review').set('Authorization', admin.token)
    expect(res.status).toBe(200)
  })

  it('lets an admin delete a review', async () => {
    const { student, mentor } = await bookedPair()
    const created = await request(app).post('/api/review').set('Authorization', student.token)
      .send({ studentId: student.id, mentorId: mentor.id, rating: 4 })
    const admin = await seedAdmin()
    const res = await request(app).delete(`/api/review/${created.body.review._id}`).set('Authorization', admin.token)
    expect(res.status).toBe(200)
  })
})
