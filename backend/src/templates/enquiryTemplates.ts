import { APP_URL, emailButton, emailLayout } from './emailLayout'

const cardRow = (label: string, value: string, last = false): string => `
  <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;margin-bottom:4px;">${label}</div>
  <div style="font-size:15px;color:#0f172a;font-weight:600;${last ? '' : 'margin-bottom:16px;'}">${value}</div>`

const card = (rows: string): string =>
  `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin-bottom:28px;">${rows}</div>`

export type ClassEnquiryPayload = {
  studentName: string
  phone: string
  email: string
  mentorName: string
  enquiryType: string // 'Demo' | 'Subject-wise'
  className: string
  subjects: string // comma-joined, or '—'
  amount: string // 'Free' or '₹1200'
  message?: string
}

/** Admin: a new class enquiry came in — contact the student + mentor. */
export const classEnquiryTemplate = (p: ClassEnquiryPayload): string =>
  emailLayout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">New class enquiry 📩</h1>
    <p style="margin:0 0 24px;color:#64748b;">
      ${p.studentName} is interested in classes with ${p.mentorName}. Reach out to
      confirm availability, then create their booking in the admin portal.
    </p>

    ${card(
      cardRow('Student', p.studentName) +
        cardRow('Contact', `${p.phone}${p.email ? ` · ${p.email}` : ''}`) +
        cardRow('Mentor', p.mentorName) +
        cardRow('Enquiry', p.enquiryType) +
        cardRow('Class', p.className || '—') +
        cardRow('Subjects', p.subjects) +
        cardRow('Indicative fee', p.amount, !p.message)
    )}

    ${
      p.message
        ? `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px 20px;margin-bottom:28px;color:#1e40af;font-size:14px;">
             <strong>Note from student:</strong> ${p.message}
           </div>`
        : ''
    }

    <div style="text-align:center;">
      ${emailButton('Open enquiries', `${APP_URL}/admin/enquiries`)}
    </div>
  `)
