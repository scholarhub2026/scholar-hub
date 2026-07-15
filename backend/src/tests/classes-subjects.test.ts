import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'
import { seedAdmin, seedStudent, seedSubject } from './helpers'

const app = createApp()

describe('Subject admin flow', () => {
  it('creates a subject', async () => {
    const admin = await seedAdmin()
    const res = await request(app)
      .post('/api/subject/subject')
      .set('Authorization', admin.token)
      .send({ name: 'Physics' })
    expect(res.status).toBe(201)
    expect(res.body.data.name).toBe('physics') // lowercased
  })

  it('rejects a duplicate subject (409)', async () => {
    const admin = await seedAdmin()
    await request(app).post('/api/subject/subject').set('Authorization', admin.token).send({ name: 'Chemistry' })
    const res = await request(app).post('/api/subject/subject').set('Authorization', admin.token).send({ name: 'Chemistry' })
    expect(res.status).toBe(409)
  })

  it('rejects an invalid type', async () => {
    const admin = await seedAdmin()
    const res = await request(app).post('/api/subject/nonsense').set('Authorization', admin.token).send({ name: 'X' })
    expect(res.status).toBe(400)
  })

  it('lists subjects (public)', async () => {
    await seedSubject('biology')
    const res = await request(app).get('/api/subject/subject')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
  })

  it('updates a subject', async () => {
    const admin = await seedAdmin()
    const subject = await seedSubject('geo')
    const res = await request(app)
      .put(`/api/subject/${subject._id}`)
      .set('Authorization', admin.token)
      .send({ name: 'geography' })
    expect(res.status).toBe(201)
  })

  it('soft-deletes a subject', async () => {
    const admin = await seedAdmin()
    const subject = await seedSubject('history')
    const res = await request(app).delete(`/api/subject/${subject._id}`).set('Authorization', admin.token)
    expect(res.status).toBe(200)
  })

  it('blocks a non-admin from creating', async () => {
    const student = await seedStudent()
    const res = await request(app).post('/api/subject/subject').set('Authorization', student.token).send({ name: 'X' })
    expect(res.status).toBe(403)
  })
})

describe('Classes admin flow', () => {
  async function classBody(overrides: any = {}) {
    const subject = await seedSubject()
    return {
      class: overrides.class ?? 'Grade 10',
      syllabus: overrides.syllabus ?? 'cbse',
      basePrice: overrides.basePrice ?? '500',
      subjects: [{ subjectId: String(subject._id), price: 500 }],
      sortOrder: overrides.sortOrder ?? 1,
    }
  }

  it('creates a class', async () => {
    const admin = await seedAdmin()
    const res = await request(app).post('/api/classes').set('Authorization', admin.token).send(await classBody())
    expect(res.status).toBe(200)
  })

  it('rejects a duplicate sortOrder', async () => {
    const admin = await seedAdmin()
    await request(app).post('/api/classes').set('Authorization', admin.token).send(await classBody({ sortOrder: 5 }))
    const res = await request(app).post('/api/classes').set('Authorization', admin.token).send(await classBody({ sortOrder: 5, class: 'Grade 11' }))
    expect(res.status).toBe(400)
  })

  it('lists classes (public)', async () => {
    const res = await request(app).get('/api/classes')
    expect(res.status).toBe(200)
  })

  it('blocks a non-admin from creating', async () => {
    const student = await seedStudent()
    const res = await request(app).post('/api/classes').set('Authorization', student.token).send(await classBody())
    expect(res.status).toBe(403)
  })
})
