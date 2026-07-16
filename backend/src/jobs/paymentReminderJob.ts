import { schedule } from 'node-cron'

import Booking from '../models/Booking'
import Auth from '../models/Auth'
import { sendMail } from '../utils/mailService'
import { sendPushToRole, sendPushToUser } from '../utils/pushService'
import {
  daysOverdue,
  formatDueDate,
  todayIST,
  toUtcMidnight,
} from '../utils/paymentSchedule'

const mentorFullName = (mentor: any): string =>
  `${mentor?.firstName ?? ''} ${mentor?.lastName ?? ''}`.trim() || 'your mentor'

/**
 * Send due/overdue payment reminders. Runs daily (see start below); exported
 * separately so tests can drive it without cron.
 *
 * - Students with a payment due today or overdue get a push + email.
 * - Overdue bookings are re-reminded every day until the payment is recorded.
 * - Admins get ONE digest (push to the role + an email per admin), not one
 *   ping per booking.
 * - `lastReminderAt` dedups within 12h so double runs / manual triggers don't
 *   spam anyone.
 */
export const runPaymentReminders = async (
  now: Date = new Date()
): Promise<{ reminded: number }> => {
  const t = todayIST(now)
  const twelveHoursAgo = new Date(now.getTime() - 12 * 3600_000)

  const due = await Booking.find({
    bookingStatus: 'confirmed',
    nextDueDate: { $ne: null, $lte: t },
    $or: [
      { lastReminderAt: null },
      { lastReminderAt: { $lt: twelveHoursAgo } },
    ],
  })
    .populate('mentorId', 'firstName lastName')
    .limit(500) // safety valve; revisit if volume ever approaches this

  const digestItems: Array<{
    studentName: string
    mentorName: string
    amount: number
    dueDate: string
    daysOverdue: number
  }> = []

  for (const booking of due) {
    try {
      const dueDate = toUtcMidnight(booking.nextDueDate as Date)
      const overdueDays = daysOverdue(dueDate, t)
      const mentorName = mentorFullName(booking.mentorId)
      const dueLabel = formatDueDate(dueDate)
      const freq = booking.paymentFrequency || 'monthly'

      sendMail(
        booking.email,
        overdueDays > 0
          ? `Payment overdue (${overdueDays} day${overdueDays === 1 ? '' : 's'}) — Scholar Hub`
          : 'Payment due today — Scholar Hub',
        'paymentReminder',
        {
          studentName: booking.studentName,
          mentorName,
          amount: booking.totalAmount,
          frequency: freq,
          dueDate: dueLabel,
          daysOverdue: overdueDays,
        }
      ).catch(err => console.error('[reminders] student mail failed:', err.message))

      sendPushToUser(booking.studentId?.toString() ?? '', {
        title: overdueDays > 0 ? 'Payment overdue' : 'Payment due today',
        body:
          overdueDays > 0
            ? `₹${booking.totalAmount} for your classes with ${mentorName} is ${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue.`
            : `₹${booking.totalAmount} for your classes with ${mentorName} is due today.`,
        data: { type: 'payment_due', bookingId: booking._id.toString() },
      }).catch(err => console.error('[reminders] student push failed:', err.message))

      digestItems.push({
        studentName: booking.studentName,
        mentorName,
        amount: booking.totalAmount,
        dueDate: dueLabel,
        daysOverdue: overdueDays,
      })

      // Mark reminded regardless of provider success — the daily cadence
      // retries tomorrow anyway, and this avoids spam loops on partial outages.
      await Booking.updateOne({ _id: booking._id }, { lastReminderAt: now })
    } catch (err: any) {
      console.error('[reminders] booking failed:', booking._id.toString(), err.message)
    }
  }

  // ---- Admin digest (one, not per-booking) ----
  if (digestItems.length > 0) {
    const overdueCount = digestItems.filter(i => i.daysOverdue > 0).length
    const todayCount = digestItems.length - overdueCount

    sendPushToRole('ADMIN', {
      title: 'Payments to collect',
      body: `${overdueCount} overdue · ${todayCount} due today`,
      data: { type: 'payment_due' },
    }).catch(err => console.error('[reminders] admin push failed:', err.message))

    try {
      const admins = await Auth.find({ role: 'ADMIN' }).select('email')
      const dateLabel = formatDueDate(t)
      for (const admin of admins) {
        sendMail(admin.email, `Payments to collect — ${dateLabel}`, 'paymentDueDigest', {
          date: dateLabel,
          items: digestItems,
        }).catch(err => console.error('[reminders] admin mail failed:', err.message))
      }
    } catch (err: any) {
      console.error('[reminders] admin digest failed:', err.message)
    }
  }

  if (digestItems.length > 0) {
    console.log(`[reminders] sent ${digestItems.length} payment reminder(s)`)
  }
  return { reminded: digestItems.length }
}

/** Start the daily payment-reminder cron: 09:00 IST every day. */
export const startPaymentReminderJob = (): void => {
  schedule(
    '0 9 * * *',
    () => runPaymentReminders().catch(err => console.error('[reminders]', err)),
    { timezone: 'Asia/Kolkata', name: 'payment-reminders' }
  )
  console.log('⏰ Payment reminder job scheduled (daily 09:00 IST)')
}
