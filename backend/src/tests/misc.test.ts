import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'
import { seedAdmin, seedStudent } from './helpers'

const app = createApp()

describe('Ads flow', () => {
  it('creates an ad (admin)', async () => {
    const admin = await seedAdmin()
    const res = await request(app)
      .post('/api/ads')
      .set('Authorization', admin.token)
      .send({ title: 'Promo', imageUrl: 'https://img/x.png' })
    expect(res.status).toBe(201)
  })

  it('lists active ads (public)', async () => {
    const res = await request(app).get('/api/ads')
    expect(res.status).toBe(200)
  })

  it('lists all ads (admin)', async () => {
    const admin = await seedAdmin()
    const res = await request(app).get('/api/ads/all').set('Authorization', admin.token)
    expect(res.status).toBe(200)
  })

  it('updates then deletes an ad', async () => {
    const admin = await seedAdmin()
    const created = await request(app).post('/api/ads').set('Authorization', admin.token)
      .send({ title: 'A', imageUrl: 'https://img/a.png' })
    const id = created.body.data._id
    const upd = await request(app).put(`/api/ads/${id}`).set('Authorization', admin.token).send({ title: 'B' })
    expect(upd.status).toBe(200)
    const del = await request(app).delete(`/api/ads/${id}`).set('Authorization', admin.token)
    expect(del.status).toBe(200)
  })

  it('blocks a non-admin from creating', async () => {
    const student = await seedStudent()
    const res = await request(app).post('/api/ads').set('Authorization', student.token)
      .send({ title: 'X', imageUrl: 'y' })
    expect(res.status).toBe(403)
  })
})

describe('Inquiry-form flow', () => {
  it('accepts a public inquiry submission', async () => {
    const res = await request(app).post('/api/inquery-form').send({
      name: 'Parent',
      email: 'parent@test.com',
      phoneNumber: '9999999999',
      message: 'Need a mentor',
      place: 'City',
      subject: 'Maths',
    })
    expect(res.status).toBe(200)
  })

  it('rejects an incomplete inquiry', async () => {
    const res = await request(app).post('/api/inquery-form').send({ name: 'X' })
    expect(res.status).toBe(400)
  })

  it('lets an admin list and delete inquiries', async () => {
    const admin = await seedAdmin()
    await request(app).post('/api/inquery-form').send({
      name: 'P', email: 'p2@test.com', phoneNumber: '1', message: 'm', place: 'c', subject: 's',
    })
    const list = await request(app).get('/api/inquery-form').set('Authorization', admin.token)
    expect(list.status).toBe(200)
    const id = list.body.data[0]._id
    const del = await request(app).delete(`/api/inquery-form/${id}`).set('Authorization', admin.token)
    expect(del.status).toBe(200)
  })

  it('blocks a non-admin from listing', async () => {
    const student = await seedStudent()
    const res = await request(app).get('/api/inquery-form').set('Authorization', student.token)
    expect(res.status).toBe(403)
  })
})

describe('Referral flow', () => {
  it('returns a referral overview (admin)', async () => {
    const admin = await seedAdmin()
    const res = await request(app).get('/api/referral').set('Authorization', admin.token)
    expect(res.status).toBe(200)
    expect(res.body.summary).toHaveProperty('totalReferrals')
  })

  it('returns a user’s own referral info + code', async () => {
    const student = await seedStudent()
    const res = await request(app).get(`/api/referral/${student.id}`).set('Authorization', student.token)
    expect(res.status).toBe(200)
    expect(res.body.data.referralCode).toBeTruthy()
  })
})
