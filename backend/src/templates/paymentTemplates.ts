import { APP_URL, emailButton, emailLayout } from './emailLayout'

export type PaymentReminderPayload = {
  studentName: string
  mentorName: string
  amount: number
  frequency: string
  dueDate: string // formatted, e.g. "16 Aug 2026"
  daysOverdue: number
}

/** Student: your fee is due today / overdue. */
export const paymentReminderTemplate = (p: PaymentReminderPayload): string => {
  const overdue = p.daysOverdue > 0
  const accent = overdue ? '#dc2626' : '#d97706'
  const headline = overdue ? 'Payment overdue' : 'Payment due today'
  return emailLayout(`
    <div style="height:4px;background:${accent};border-radius:2px;margin-bottom:20px;"></div>
    <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">${headline}</h1>
    <p style="margin:0 0 24px;color:#64748b;">
      Hi ${p.studentName}, ${
        overdue
          ? `your class fee is <strong style="color:${accent};">${p.daysOverdue} day${p.daysOverdue === 1 ? '' : 's'} overdue</strong>.`
          : 'a friendly reminder that your class fee is due today.'
      }
    </p>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin-bottom:28px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;margin-bottom:4px;">Amount</div>
      <div style="font-size:20px;font-weight:700;color:#0f172a;margin-bottom:16px;">₹${p.amount}</div>
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;margin-bottom:4px;">For classes with</div>
      <div style="font-size:15px;color:#0f172a;font-weight:600;margin-bottom:16px;">${p.mentorName}</div>
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;margin-bottom:4px;">Due date</div>
      <div style="font-size:15px;color:${overdue ? accent : '#0f172a'};font-weight:600;">${p.dueDate}</div>
    </div>

    <p style="margin:0 0 24px;color:#64748b;">
      Please keep the amount ready — our team will collect it from you. If you've
      already paid, you can ignore this message.
    </p>

    <div style="text-align:center;">
      ${emailButton('View my bookings', `${APP_URL}/app/bookings`)}
    </div>
  `)
}

export type PaymentDueDigestPayload = {
  date: string // formatted digest date
  items: Array<{
    studentName: string
    mentorName: string
    amount: number
    dueDate: string
    daysOverdue: number
  }>
}

/** Admin: daily digest of everything due/overdue. */
export const paymentDueDigestTemplate = (p: PaymentDueDigestPayload): string => {
  const rows = p.items
    .map((i) => {
      const overdue = i.daysOverdue > 0
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-weight:600;">${i.studentName}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#334155;">${i.mentorName}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-weight:700;">₹${i.amount}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;color:${overdue ? '#dc2626' : '#334155'};">
          ${i.dueDate}${overdue ? ` <span style="font-size:12px;">(${i.daysOverdue}d overdue)</span>` : ''}
        </td>
      </tr>`
    })
    .join('')

  return emailLayout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">Payments to collect — ${p.date}</h1>
    <p style="margin:0 0 24px;color:#64748b;">
      ${p.items.length} payment${p.items.length === 1 ? ' is' : 's are'} due or overdue today.
    </p>

    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:28px;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;">Student</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;">Mentor</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;">Amount</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;">Due</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div style="text-align:center;">
      ${emailButton('Open Payments', `${APP_URL}/admin/payments`)}
    </div>
  `)
}
