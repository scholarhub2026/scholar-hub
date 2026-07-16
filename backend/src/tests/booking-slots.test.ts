import { describe, it, expect, beforeAll } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'
import Booking from '../models/Booking'
import { seedStudent, seedMentor, seedSubject, seedClass, bookingPayload } from './helpers'

const app = createApp()

// Ensure the partial-unique claimKey index exists so the concurrent 1-on-1
// double-book test exercises the real E11000 backstop.
beforeAll(async () => {
  await Booking.syncIndexes()
})

/** "YYYY-MM-DD" for the next future occurrence of a JS weekday (0=Sun … 6=Sat). */
function nextDateFor(jsDay: number): string {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  do {
    d.setUTCDate(d.getUTCDate() + 1)
  } while (d.getUTCDay() !== jsDay)
  const two = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${two(d.getUTCMonth() + 1)}-${two(d.getUTCDate())}`
}

// Mentor with: Mon 18-19 (1-on-1), Mon 19-20 (group of 3), Sat 10-11 (cap 2).
async function setupMentor() {
  const mentor = await seedMentor()
  const subject = await seedSubject()
  const cls = await seedClass({ subject })
  await request(app)
    .put(`/api/mentor/${mentor.id}/availability`)
    .set('Authorization', mentor.token)
    .send({
      is_available: true,
      weekly_availability: [
        { dayOfWeek: 1, startTime: '18:00', endTime: '19:00', capacity: 1 },
        { dayOfWeek: 1, startTime: '19:00', endTime: '20:00', capacity: 3 },
        { dayOfWeek: 6, startTime: '10:00', endTime: '11:00', capacity: 2 },
      ],
    })
  const avail = await request(app).get(`/api/mentor/${mentor.id}/availability`)
  return {
    mentor,
    subjectId: String(subject._id),
    classId: String(cls._id),
    slots: avail.body.slots as any[],
  }
}

const findSlot = (slots: any[], start: string) => slots.find((s) => s.startTime === start)

// Book a slot as a fresh student. Returns the response + the student.
async function bookSlot(
  ctx: { mentor: any; subjectId: string; classId: string },
  slot: any,
  cadence: 'recurring' | 'single',
  date?: string,
) {
  const student = await seedStudent()
  const base = bookingPayload({
    studentId: student.id,
    mentorId: ctx.mentor.id,
    classId: ctx.classId,
    subjectId: ctx.subjectId,
    email: student.user.email,
  })
  const res = await request(app)
    .post('/api/booking')
    .set('Authorization', student.token)
    .send({
      ...base,
      scheduleCadence: cadence,
      reservedSlots: [
        {
          slotId: slot._id,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          cadence,
          ...(date ? { date } : {}),
        },
      ],
    })
  return { res, student }
}

const getAvail = (mentorId: string) => request(app).get(`/api/mentor/${mentorId}/availability`)

describe('Slot scheduling', () => {
  it('books a recurring 1-on-1 slot and marks it full', async () => {
    const ctx = await setupMentor()
    const oneOnOne = findSlot(ctx.slots, '18:00')
    const { res } = await bookSlot(ctx, oneOnOne, 'recurring')
    expect(res.status).toBe(201)
    expect(res.body.newBooking.reservedSlots).toHaveLength(1)
    expect(res.body.newBooking.scheduleCadence).toBe('recurring')

    const avail = await getAvail(ctx.mentor.id)
    const slot = findSlot(avail.body.slots, '18:00')
    expect(slot.recurringRemaining).toBe(0)
  })

  it('rejects a second student on a full 1-on-1 slot (409)', async () => {
    const ctx = await setupMentor()
    const oneOnOne = findSlot(ctx.slots, '18:00')
    await bookSlot(ctx, oneOnOne, 'recurring')
    const { res } = await bookSlot(ctx, oneOnOne, 'recurring')
    expect(res.status).toBe(409)
  })

  it('lets multiple students share a group slot until full', async () => {
    const ctx = await setupMentor()
    const group = findSlot(ctx.slots, '19:00') // capacity 3
    const a = await bookSlot(ctx, group, 'recurring')
    const b = await bookSlot(ctx, group, 'recurring')
    expect(a.res.status).toBe(201)
    expect(b.res.status).toBe(201)

    const avail = await getAvail(ctx.mentor.id)
    expect(findSlot(avail.body.slots, '19:00').recurringRemaining).toBe(1)

    // Third fills it; fourth is rejected.
    const c = await bookSlot(ctx, group, 'recurring')
    expect(c.res.status).toBe(201)
    const d = await bookSlot(ctx, group, 'recurring')
    expect(d.res.status).toBe(409)
  })

  it('books a single dated session that only consumes a seat on that date', async () => {
    const ctx = await setupMentor()
    const sat = findSlot(ctx.slots, '10:00') // Saturday, capacity 2
    const date = nextDateFor(6)
    const { res } = await bookSlot(ctx, sat, 'single', date)
    expect(res.status).toBe(201)

    const avail = await getAvail(ctx.mentor.id)
    const slot = findSlot(avail.body.slots, '10:00')
    // Recurring seats untouched (single occupies only its date)…
    expect(slot.recurringRemaining).toBe(2)
    // …and that date shows one hold.
    expect(slot.dateHolds[date]).toBe(1)
  })

  it('frees the seat when the booking is cancelled', async () => {
    const ctx = await setupMentor()
    const oneOnOne = findSlot(ctx.slots, '18:00')
    const first = await bookSlot(ctx, oneOnOne, 'recurring')
    const bookingId = first.res.body.newBooking._id
    await request(app)
      .patch(`/api/booking/${bookingId}/cancel`)
      .set('Authorization', first.student.token)

    const avail = await getAvail(ctx.mentor.id)
    expect(findSlot(avail.body.slots, '18:00').recurringRemaining).toBe(1)

    // Re-booking the freed 1-on-1 succeeds.
    const second = await bookSlot(ctx, oneOnOne, 'recurring')
    expect(second.res.status).toBe(201)
  })

  it('only one of two concurrent 1-on-1 bookings succeeds', async () => {
    const ctx = await setupMentor()
    const oneOnOne = findSlot(ctx.slots, '18:00')
    const [a, b] = await Promise.all([
      bookSlot(ctx, oneOnOne, 'recurring'),
      bookSlot(ctx, oneOnOne, 'recurring'),
    ])
    const statuses = [a.res.status, b.res.status].sort()
    expect(statuses).toEqual([201, 409])
  })

  it('rejects a single date whose weekday does not match the slot', async () => {
    const ctx = await setupMentor()
    const sat = findSlot(ctx.slots, '10:00') // Saturday slot
    const monday = nextDateFor(1) // a Monday date
    const { res } = await bookSlot(ctx, sat, 'single', monday)
    expect(res.status).toBe(400)
  })

  it('rejects a reserved slot that is not in the mentor template', async () => {
    const ctx = await setupMentor()
    const fakeSlot = {
      _id: '64b64b64b64b64b64b64b64b',
      dayOfWeek: 1,
      startTime: '18:00',
      endTime: '19:00',
    }
    const { res } = await bookSlot(ctx, fakeSlot, 'recurring')
    expect(res.status).toBe(400)
  })
})
