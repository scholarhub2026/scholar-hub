import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'
import { seedUser, seedStudent, bearer } from './helpers'
import jwt from 'jsonwebtoken'

const app = createApp()

describe('Auth flow', () => {
  describe('POST /api/auth/signin (register)', () => {
    it('registers a new student and returns a token', async () => {
      const res = await request(app).post('/api/auth/signin').send({
        email: 'newuser@test.com',
        phoneNumber: '9990001111',
        firstName: 'New',
        lastName: 'User',
        password: 'Password123',
      })
      expect(res.status).toBe(201)
      expect(res.body?.data?.token).toBeTruthy()
      expect(res.body?.data?.role).toBe('STUDENT')
    })

    it('rejects a short password', async () => {
      const res = await request(app).post('/api/auth/signin').send({
        email: 'shortpw@test.com',
        phoneNumber: '9990002222',
        firstName: 'A',
        lastName: 'B',
        password: '123',
      })
      expect(res.status).toBe(400)
    })

    it('rejects a duplicate email', async () => {
      await seedUser({ email: 'dupe@test.com' })
      const res = await request(app).post('/api/auth/signin').send({
        email: 'dupe@test.com',
        phoneNumber: '9990003333',
        firstName: 'A',
        lastName: 'B',
        password: 'Password123',
      })
      expect(res.status).toBe(400)
    })

    it('rejects missing required fields', async () => {
      const res = await request(app).post('/api/auth/signin').send({ email: 'x@test.com' })
      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/auth/login', () => {
    it('logs in with correct credentials', async () => {
      const { user, password } = await seedStudent({ email: 'login@test.com' })
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@test.com', password })
      expect(res.status).toBe(201)
      expect(res.body.token).toBeTruthy()
      expect(res.body.user.email).toBe(user.email)
      expect(res.body.user.role).toBe('STUDENT')
    })

    it('rejects a wrong password', async () => {
      await seedStudent({ email: 'wrongpw@test.com' })
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'wrongpw@test.com', password: 'nope' })
      expect(res.status).toBe(400)
    })

    it('rejects an unknown email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'ghost@test.com', password: 'Password123' })
      expect(res.status).toBe(400)
    })

    it('rejects a disabled account', async () => {
      const { password } = await seedStudent({ email: 'disabled@test.com', isActive: false })
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'disabled@test.com', password })
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/auth/verify-token', () => {
    it('validates a good token', async () => {
      const { id } = await seedStudent()
      const res = await request(app)
        .get('/api/auth/verify-token')
        .set('Authorization', bearer(id))
      expect(res.status).toBe(200)
      expect(res.body.valid).toBe(true)
      expect(res.body.user.id).toBe(id)
    })

    it('rejects a missing token', async () => {
      const res = await request(app).get('/api/auth/verify-token')
      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/auth/refresh', () => {
    it('issues a new access token from a refresh token', async () => {
      const { id } = await seedStudent()
      const refreshToken = jwt.sign({ _id: id }, process.env.REFRESH_TOKEN_SECRET as string)
      const res = await request(app).post('/api/auth/refresh').send({ refreshToken })
      expect(res.status).toBe(200)
      expect(res.body.token).toBeTruthy()
      expect(res.body.user.id).toBe(id)
    })

    it('rejects a missing refresh token', async () => {
      const res = await request(app).post('/api/auth/refresh').send({})
      expect(res.status).toBe(401)
    })
  })
})
