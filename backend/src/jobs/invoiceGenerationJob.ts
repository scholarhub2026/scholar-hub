import { schedule } from 'node-cron'

import Booking from '../models/Booking'
import { generateInvoiceForBooking } from '../utils/invoiceService'
import { todayIST } from '../utils/paymentSchedule'

/**
 * Generate weekly/monthly invoices for metered bookings whose billing
 * boundary (nextDueDate) has arrived. Exported so tests can drive it without
 * cron. Per-session bookings invoice at admin verify, not here.
 *
 * Race/duplicate safety: the unique Invoice.periodKey index — a second run of
 * the same period comes back 'duplicate' and is skipped harmlessly.
 */
export const runInvoiceGeneration = async (
  now: Date = new Date()
): Promise<{ generated: number; empty: number; skipped: number }> => {
  const t = todayIST(now)

  const dueBookings = await Booking.find({
    billingMode: 'metered',
    bookingStatus: 'confirmed',
    paymentFrequency: { $in: ['weekly', 'monthly'] },
    nextDueDate: { $ne: null, $lte: t },
  })
    .select('_id')
    .limit(500) // safety valve, matches the reminder job

  let generated = 0
  let empty = 0
  let skipped = 0
  for (const b of dueBookings) {
    try {
      const result = await generateInvoiceForBooking(String(b._id), {
        generatedBy: 'cron',
      })
      if (result.outcome === 'generated') generated++
      else if (result.outcome === 'empty-period') empty++
      else skipped++
    } catch (err: any) {
      skipped++
      console.error('[invoices] booking failed:', String(b._id), err.message)
    }
  }

  if (dueBookings.length > 0) {
    console.log(
      `[invoices] cycle run: ${generated} generated, ${empty} empty, ${skipped} skipped`
    )
  }
  return { generated, empty, skipped }
}

/** Start the daily invoice-generation cron: 08:00 IST (before 09:00 reminders). */
export const startInvoiceGenerationJob = (): void => {
  schedule(
    '0 8 * * *',
    () => runInvoiceGeneration().catch(err => console.error('[invoices]', err)),
    { timezone: 'Asia/Kolkata', name: 'invoice-generation' }
  )
  console.log('⏰ Invoice generation job scheduled (daily 08:00 IST)')
}
