import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'
import { seedAdmin, seedMentor, seedStudent } from './helpers'

const app = createApp()

describe('Mentor flow', () => {
  describe('POST /api/mentor (admin creates mentor)', () => {
    it('creates a mentor application', async () => {
      const admin = await seedAdmin()
      const res = await request(app)
        .post('/api/mentor')
        .set('Authorization', admin.token)
        .send({ email: 'mentor1@test.com', name: 'Mentor One', phone: '9991110000', place: 'City', message: 'hi' })
      expect(res.status).toBe(201)
    })

    it('rejects a duplicate mentor email', async () => {
      const admin = await seedAdmin()
      await request(app).post('/api/mentor').set('Authorization', admin.token)
        .send({ email: 'dupmentor@test.com', name: 'M', phone: '9991110001', place: 'C', message: 'x' })
      const res = await request(app).post('/api/mentor').set('Authorization', admin.token)
        .send({ email: 'dupmentor@test.com', name: 'M', phone: '9991110002', place: 'C', message: 'x' })
      expect(res.status).toBe(400)
    })

    it('blocks a non-admin', async () => {
      const student = await seedStudent()
      const res = await request(app)
        .post('/api/mentor')
        .set('Authorization', student.token)
        .send({ email: 'm@test.com', name: 'M', phone: '1', place: 'C', message: 'x' })
      expect(res.status).toBe(403)
    })
  })

  describe('PUT /api/mentor/:id (approve)', () => {
    it('admin approves a mentor and gets credentials + email sent', async () => {
      const admin = await seedAdmin()
      const mentor = await seedMentor({ admin_approve: false })
      const res = await request(app)
        .put(`/api/mentor/${mentor.id}`)
        .set('Authorization', admin.token)
        .send({ admin_approve: true })
      expect(res.status).toBe(200)
      expect(res.body.credentials).toBeTruthy()
      expect(res.body.emailSent).toBe(true)
    })

    it('blocks a non-admin from approving (403)', async () => {
      const mentor = await seedMentor({ admin_approve: false })
      const res = await request(app)
        .put(`/api/mentor/${mentor.id}`)
        .set('Authorization', mentor.token)
        .send({ admin_approve: true })
      expect(res.status).toBe(403)
    })
  })

  describe('POST /api/mentor/:id/resend-credentials', () => {
    it('returns fresh credentials', async () => {
      const admin = await seedAdmin()
      const mentor = await seedMentor()
      const res = await request(app)
        .post(`/api/mentor/${mentor.id}/resend-credentials`)
        .set('Authorization', admin.token)
      expect(res.status).toBe(200)
      expect(res.body.credentials?.email).toBeTruthy()
    })
  })

  describe('PUT /api/mentor/:id/availability', () => {
    it('mentor sets their weekly availability', async () => {
      const mentor = await seedMentor()
      const res = await request(app)
        .put(`/api/mentor/${mentor.id}/availability`)
        .set('Authorization', mentor.token)
        .send({
          is_available: true,
          weekly_availability: [
            { dayOfWeek: 1, startTime: '18:00', endTime: '19:00', capacity: 1 },
            { dayOfWeek: 6, startTime: '10:00', endTime: '11:00', capacity: 3 },
          ],
        })
      expect(res.status).toBe(200)
      expect(res.body.data.weekly_availability.length).toBe(2)
    })

    it('rejects overlapping slots on the same day', async () => {
      const mentor = await seedMentor()
      const res = await request(app)
        .put(`/api/mentor/${mentor.id}/availability`)
        .set('Authorization', mentor.token)
        .send({
          weekly_availability: [
            { dayOfWeek: 1, startTime: '18:00', endTime: '19:30' },
            { dayOfWeek: 1, startTime: '19:00', endTime: '20:00' },
          ],
        })
      expect(res.status).toBe(400)
    })

    it('rejects endTime before startTime', async () => {
      const mentor = await seedMentor()
      const res = await request(app)
        .put(`/api/mentor/${mentor.id}/availability`)
        .set('Authorization', mentor.token)
        .send({
          weekly_availability: [
            { dayOfWeek: 2, startTime: '19:00', endTime: '18:00' },
          ],
        })
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/mentor/:id/availability (public)', () => {
    it('returns active slots with remaining seats', async () => {
      const mentor = await seedMentor()
      await request(app)
        .put(`/api/mentor/${mentor.id}/availability`)
        .set('Authorization', mentor.token)
        .send({
          weekly_availability: [
            { dayOfWeek: 1, startTime: '18:00', endTime: '19:00', capacity: 2 },
          ],
        })
      const res = await request(app).get(`/api/mentor/${mentor.id}/availability`)
      expect(res.status).toBe(200)
      expect(res.body.slots.length).toBe(1)
      expect(res.body.slots[0].recurringRemaining).toBe(2)
    })
  })

  describe('DELETE /api/mentor/:id', () => {
    it('admin deletes a mentor', async () => {
      const admin = await seedAdmin()
      const mentor = await seedMentor()
      const res = await request(app).delete(`/api/mentor/${mentor.id}`).set('Authorization', admin.token)
      expect(res.status).toBe(200)
    })

    it('blocks a non-admin', async () => {
      const mentor = await seedMentor()
      const res = await request(app).delete(`/api/mentor/${mentor.id}`).set('Authorization', mentor.token)
      expect(res.status).toBe(403)
    })
  })

  describe('GET /api/mentor (public)', () => {
    it('lists mentors', async () => {
      await seedMentor()
      const res = await request(app).get('/api/mentor')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
    })

    it('gets a single mentor by id', async () => {
      const mentor = await seedMentor()
      const res = await request(app).get(`/api/mentor?id=${mentor.id}`)
      expect(res.status).toBe(200)
      expect(res.body.data._id).toBe(mentor.id)
    })

    it('404s for an unknown mentor id', async () => {
      const res = await request(app).get('/api/mentor?id=64b64b64b64b64b64b64b64b')
      expect(res.status).toBe(404)
    })
  })
})
