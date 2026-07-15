import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'
import { seedStudent } from './helpers'

const app = createApp()

describe('harness smoke', () => {
  it('health check responds', async () => {
    const res = await request(app).get('/check')
    expect(res.status).toBe(200)
  })

  it('mints a token and passes requireAuth (register→login path exists)', async () => {
    const { id, token } = await seedStudent()
    // Hitting a requireAuth route with a valid token should not 401.
    const res = await request(app)
      .get(`/api/booking/${id}`)
      .set('Authorization', token)
    expect(res.status).not.toBe(401)
  })

  it('blocks a guarded route without a token (AUTH_ENFORCED)', async () => {
    const res = await request(app).post('/api/booking').send({})
    expect(res.status).toBe(401)
  })
})
