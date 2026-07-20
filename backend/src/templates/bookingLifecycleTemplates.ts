import { APP_URL, emailButton, emailLayout } from './emailLayout'

/** Shared "label / value" row inside the slate info card. */
const cardRow = (label: string, value: string, last = false): string => `
  <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;margin-bottom:4px;">${label}</div>
  <div style="font-size:15px;color:#0f172a;font-weight:600;${last ? '' : 'margin-bottom:16px;'}">${value}</div>`

const card = (rows: string): string =>
  `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin-bottom:28px;">${rows}</div>`

export type TeacherAcceptRequestPayload = {
  mentorName: string
  studentName: string
  detail: string // class / subjects summary
  frequency: string
}

/** Tutor: the admin approved a booking with you — please accept or decline. */
export const teacherAcceptRequestTemplate = (
  p: TeacherAcceptRequestPayload
): string =>
  emailLayout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">New student waiting for you 🎓</h1>
    <p style="margin:0 0 24px;color:#64748b;">
      Hi ${p.mentorName}, a booking with you has been approved by our team and is
      now waiting for <strong>your acceptance</strong>. Classes begin only after
      you accept.
    </p>

    ${card(
      cardRow('Student', p.studentName) +
        cardRow('Class & subjects', p.detail) +
        cardRow('Billing', p.frequency, true)
    )}

    <div style="text-align:center;">
      ${emailButton('Review & accept', `${APP_URL}/mentor/requests`)}
    </div>
  `)

export type BookingAwaitingTeacherPayload = {
  studentName: string
  mentorName: string
}

/** Student: admin approved; we're waiting for the teacher to accept. */
export const bookingAwaitingTeacherTemplate = (
  p: BookingAwaitingTeacherPayload
): string =>
  emailLayout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">Almost there ⏳</h1>
    <p style="margin:0 0 24px;color:#64748b;">
      Hi ${p.studentName}, our team has approved your booking request. We've
      passed it to ${p.mentorName} — you'll get a confirmation as soon as they
      accept.
    </p>

    <div style="text-align:center;">
      ${emailButton('View my bookings', `${APP_URL}/app/bookings`)}
    </div>
  `)

export type TeacherAcceptedPayload = {
  studentName: string
  mentorName: string
  detail: string
  startDate: string
  billingLine: string // e.g. "₹500 per class, invoiced monthly"
}

/** Student: the teacher accepted — booking confirmed. */
export const teacherAcceptedTemplate = (p: TeacherAcceptedPayload): string =>
  emailLayout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">Your booking is confirmed 🎉</h1>
    <p style="margin:0 0 24px;color:#64748b;">
      Hi ${p.studentName}, ${p.mentorName} has accepted your booking. You're all
      set!
    </p>

    ${card(
      cardRow('Mentor', p.mentorName) +
        cardRow('Class & subjects', p.detail) +
        cardRow('Classes start', p.startDate) +
        cardRow('Billing', p.billingLine, true)
    )}

    <p style="margin:0 0 24px;color:#64748b;">
      No payment is needed right now — invoices are raised after your classes,
      based on the sessions actually conducted.
    </p>

    <div style="text-align:center;">
      ${emailButton('View my bookings', `${APP_URL}/app/bookings`)}
    </div>
  `)

export type TeacherDeclinedPayload = {
  studentName: string
  mentorName: string
  reason?: string
}

/** Student: the teacher couldn't take the booking. */
export const teacherDeclinedTemplate = (p: TeacherDeclinedPayload): string =>
  emailLayout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">Update on your booking request</h1>
    <p style="margin:0 0 24px;color:#64748b;">
      Hi ${p.studentName}, unfortunately ${p.mentorName} isn't able to take your
      booking at this time.
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
