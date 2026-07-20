/**
 * Billing v2 cutover migration — IDEMPOTENT, safe to re-run.
 *
 * 1. Stamps every pre-existing booking `billingMode: 'legacy-flat'` so it keeps
 *    the old flat-fee-per-period collection flow (new bookings are 'metered').
 * 2. Copies embedded Booking.payments[] into the append-only Payment ledger
 *    (`legacy: true`, receipt numbers backfilled). The embedded array is left
 *    in place (read-only history for the legacy admin tab).
 * 3. Copies free-text bookingLogs[] into the Session collection
 *    (`migratedFromLog: true`, status 'verified') for history only —
 *    legacy-flat bookings never feed the pricing engine, so no double billing.
 *
 * Usage (from the backend/ folder):
 *   npm run migrate:billing-v2
 */
import mongoose from 'mongoose'
import Booking from '../models/Booking'
import Payment from '../models/Payment'
import Session from '../models/Session'
import { nextNumber } from '../models/Counter'

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

const minutesBetween = (start: string, end: string): number => {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh - sh) * 60 + (em - sm)
}

export const runMigration = async () => {
  // 1. Legacy-flat stamp — only touches docs created before this field existed.
  const stamped = await Booking.updateMany(
    { billingMode: { $exists: false } },
    { $set: { billingMode: 'legacy-flat' } }
  )
  console.log(`✅ Stamped ${stamped.modifiedCount} booking(s) as legacy-flat.`)

  // 2. Embedded payments[] → Payment ledger (idempotency: skip bookings that
  // already have legacy ledger entries).
  const withPayments = await Booking.find({
    'payments.0': { $exists: true },
  }).lean()
  let copied = 0
  for (const b of withPayments) {
    const already = await Payment.exists({ bookingId: b._id, legacy: true })
    if (already) continue
    for (const p of b.payments ?? []) {
      const collectedAt = p.collectedAt ?? new Date()
      await Payment.create({
        receiptNumber: await nextNumber(
          'receipt',
          collectedAt.getUTCFullYear()
        ),
        invoiceId: null,
        bookingId: b._id,
        studentId: b.studentId ?? null,
        amount: p.amount,
        method: 'other',
        collectedAt,
        collectedBy: p.collectedBy ?? null,
        note: p.note ?? '',
        periodLabel: p.periodLabel ?? '',
        legacy: true,
      })
      copied++
    }
  }
  console.log(`✅ Copied ${copied} embedded payment(s) into the ledger.`)

  // 3. bookingLogs[] → Session (history only; skips logs with unparseable
  // times — the old field was free-text).
  const withLogs = await Booking.find({
    'bookingLogs.0': { $exists: true },
  }).lean()
  let sessions = 0
  let skipped = 0
  for (const b of withLogs) {
    for (const logEntry of b.bookingLogs ?? []) {
      const { date, startTime, endTime } = logEntry
      if (
        !date ||
        !TIME_RE.test(startTime ?? '') ||
        !TIME_RE.test(endTime ?? '') ||
        (endTime as string) <= (startTime as string)
      ) {
        skipped++
        continue
      }
      try {
        await Session.create({
          bookingId: b._id,
          mentorId: b.mentorId,
          studentId: b.studentId,
          date,
          startTime,
          endTime,
          durationMinutes: minutesBetween(startTime!, endTime!),
          notes: logEntry.notes ?? '',
          status: 'verified',
          migratedFromLog: true,
        })
        sessions++
      } catch (err: unknown) {
        // E11000 = already migrated on a previous run — idempotent skip.
        if ((err as { code?: number })?.code === 11000) continue
        throw err
      }
    }
  }
  console.log(
    `✅ Migrated ${sessions} booking log(s) to sessions (${skipped} unparseable, skipped).`
  )
}

const run = async () => {
  const uri = process.env.DATABASE_URL
  if (!uri) {
    console.error('❌ DATABASE_URL is not set (check backend/.env).')
    process.exit(1)
  }
  await mongoose.connect(uri)
  await runMigration()
  await mongoose.disconnect()
  process.exit(0)
}

run().catch((err) => {
  console.error('❌ Billing v2 migration failed:', err)
  process.exit(1)
})
