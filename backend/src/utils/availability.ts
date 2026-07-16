import mongoose from 'mongoose'
import Booking from '../models/Booking'

export const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

/** UTC "YYYY-MM-DD" key for a date (day-granularity, timezone-stable). */
export function dateKey(d: Date): string {
  return new Date(d).toISOString().slice(0, 10)
}

export interface SlotUsage {
  recurring: number
  single: Map<string, number> // dateKey -> count
}

/**
 * Aggregate every *active* booking's reserved slots for a mentor into per-slot
 * usage. "Active" = not cancelled and payment not cancelled/failed, so an
 * in-flight unpaid booking still holds its seat (a 1-on-1 can't be oversold
 * mid-payment) while a failed/cancelled one frees it.
 *
 * Returns Map<slotId, { recurring, single: Map<dateKey, count> }>.
 * Optionally exclude one booking (used when re-checking on update).
 */
export async function getSlotUsage(
  mentorId: string | mongoose.Types.ObjectId,
  excludeBookingId?: string | mongoose.Types.ObjectId
): Promise<Map<string, SlotUsage>> {
  const match: Record<string, unknown> = {
    mentorId: new mongoose.Types.ObjectId(String(mentorId)),
    bookingStatus: { $ne: 'cancelled' },
    paymentStatus: { $nin: ['cancelled', 'failed'] },
  }
  if (excludeBookingId) {
    match._id = { $ne: new mongoose.Types.ObjectId(String(excludeBookingId)) }
  }

  const rows = await Booking.aggregate([
    { $match: match },
    { $unwind: '$reservedSlots' },
    {
      $group: {
        _id: {
          slotId: '$reservedSlots.slotId',
          cadence: '$reservedSlots.cadence',
          date: '$reservedSlots.date',
        },
        count: { $sum: 1 },
      },
    },
  ])

  const usage = new Map<string, SlotUsage>()
  for (const r of rows) {
    const slotId = r._id.slotId?.toString()
    if (!slotId) continue
    let entry = usage.get(slotId)
    if (!entry) {
      entry = { recurring: 0, single: new Map() }
      usage.set(slotId, entry)
    }
    if (r._id.cadence === 'recurring') {
      entry.recurring += r.count
    } else if (r._id.cadence === 'single' && r._id.date) {
      const k = dateKey(new Date(r._id.date))
      entry.single.set(k, (entry.single.get(k) || 0) + r.count)
    }
  }
  return usage
}

/** claimKey values — set ONLY for capacity-1 (1-on-1) slots. */
export function recurringClaimKey(slotId: string): string {
  return `${slotId}|recurring`
}
export function singleClaimKey(slotId: string, date: Date): string {
  return `${slotId}|single|${dateKey(date)}`
}
