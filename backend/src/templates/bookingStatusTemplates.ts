import { APP_URL, emailButton, emailLayout } from './emailLayout'

/** Shared "label / value" row inside the slate info card. */
const cardRow = (label: string, value: string, last = false): string => `
  <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;margin-bottom:4px;">${label}</div>
  <div style="font-size:15px;color:#0f172a;font-weight:600;${last ? '' : 'margin-bottom:16px;'}">${value}</div>`

const card = (rows: string): string =>
  `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin-bottom:28px;">${rows}</div>`

export type BookingApprovedPayload = {
  studentName: string
  mentorName: string
  amount: number
  frequency: string // daily | weekly | monthly
  startDate: string // formatted, e.g. "16 Aug 2026"
  firstDueDate: string
}

/** Student: your booking was approved by the admin. */
export const bookingApprovedTemplate = (p: BookingApprovedPayload): string =>
  emailLayout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">Your booking is confirmed 🎉</h1>
    <p style="margin:0 0 24px;color:#64748b;">
      Hi ${p.studentName}, great news — our team has approved your booking. Here are your details:
    </p>

    ${card(
      cardRow('Mentor', p.mentorName) +
        cardRow('Fee', `₹${p.amount} per ${p.frequency === 'daily' ? 'day' : p.frequency === 'weekly' ? 'week' : 'month'}`) +
        cardRow('Classes start', p.startDate) +
        cardRow('First payment due', p.firstDueDate, true)
    )}

    <p style="margin:0 0 24px;color:#64748b;">
      No payment is needed right now — you pay after your classes. Our team will
      collect the fee ${p.frequency === 'daily' ? 'each day' : p.frequency === 'weekly' ? 'every week' : 'every month'}.
    </p>

    <div style="text-align:center;">
      ${emailButton('View my bookings', `${APP_URL}/app/bookings`)}
    </div>
  `)

export type BookingApprovedMentorPayload = {
  mentorName: string
  studentName: string
  detail: string // class / subjects summary
  startDate: string
}

/** Mentor: a new student's booking with you was confirmed. */
export const bookingApprovedMentorTemplate = (
  p: BookingApprovedMentorPayload
): string =>
  emailLayout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">New confirmed student 🎓</h1>
    <p style="margin:0 0 24px;color:#64748b;">
      Hi ${p.mentorName}, a booking with you has been confirmed. Get ready to teach!
    </p>

    ${card(
      cardRow('Student', p.studentName) +
        cardRow('Class & subjects', p.detail) +
        cardRow('Classes start', p.startDate, true)
    )}

    <div style="text-align:center;">
      ${emailButton('Open my schedule', `${APP_URL}/mentor/schedule`)}
    </div>
  `)

export type BookingRejectedPayload = {
  studentName: string
  mentorName: string
  reason?: string
}

/** Student: your booking request was declined. */
export const bookingRejectedTemplate = (p: BookingRejectedPayload): string =>
  emailLayout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">Update on your booking request</h1>
    <p style="margin:0 0 24px;color:#64748b;">
      Hi ${p.studentName}, unfortunately we couldn't confirm your booking with
      ${p.mentorName} this time.
    </p>

    ${
      p.reason
        ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px;margin-bottom:28px;color:#9a3412;font-size:14px;">
             <strong>Reason:</strong> ${p.reason}
           </div>`
        : ''
    }

    <p style="margin:0 0 24px;color:#64748b;">
      Don't worry — there are many other great mentors on Scholar Hub.
    </p>

    <div style="text-align:center;">
      ${emailButton('Browse other mentors', `${APP_URL}/mentors`)}
    </div>
  `)
