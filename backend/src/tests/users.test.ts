import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'
import { seedAdmin, seedStudent } from './helpers'

const app = createApp()

describe('User admin flow', () => {
  it('lists users', async () => {
    const admin = await seedAdmin()
    await seedStudent()
    const res = await request(app).get('/api/users').set('Authorization', admin.token)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('blocks a non-admin from listing (403)', async () => {
    const student = await seedStudent()
    const res = await request(app).get('/api/users').set('Authorization', student.token)
    expect(res.status).toBe(403)
  })

  it('creates a user', async () => {
    const admin = await seedAdmin()
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', admin.token)
      .send({ email: 'created@test.com', firstName: 'C', lastName: 'D', role: 'STUDENT', password: 'Password123' })
    expect(res.status).toBe(201)
    expect(res.body.data.email).toBe('created@test.com')
  })

  it('rejects a short password', async () => {
    const admin = await seedAdmin()
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', admin.token)
      .send({ email: 'shortpw2@test.com', firstName: 'C', lastName: 'D', role: 'STUDENT', password: '12' })
    expect(res.status).toBe(400)
  })

  it('rejects an invalid role', async () => {
    const admin = await seedAdmin()
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', admin.token)
      .send({ email: 'badrole@test.com', firstName: 'C', lastName: 'D', role: 'WIZARD', password: 'Password123' })
    expect(res.status).toBe(400)
  })

  it('rejects a duplicate email (409)', async () => {
    const admin = await seedAdmin()
    await seedStudent({ email: 'dupuser@test.com' })
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', admin.token)
      .send({ email: 'dupuser@test.com', firstName: 'C', lastName: 'D', role: 'STUDENT', password: 'Password123' })
    expect(res.status).toBe(409)
  })

  it('enables/disables a user', async () => {
    const admin = await seedAdmin()
    const student = await seedStudent()
    const res = await request(app)
      .put(`/api/users/${student.id}/status`)
      .set('Authorization', admin.token)
      .send({ isActive: false })
    expect(res.status).toBe(200)
    expect(res.body.data.isActive).toBe(false)
  })

  it('rejects a non-boolean isActive', async () => {
    const admin = await seedAdmin()
    const student = await seedStudent()
    const res = await request(app)
      .put(`/api/users/${student.id}/status`)
      .set('Authorization', admin.token)
      .send({ isActive: 'yes' })
    expect(res.status).toBe(400)
  })
})
