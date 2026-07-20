import { APP_URL, emailButton, emailLayout } from './emailLayout'

export type InvoiceLineItemView = {
  description: string
  amount: number
}

/** Simple line-items table used by both the invoice notice and the receipt. */
const lineItemsTable = (items: InvoiceLineItemView[], total: number): string => `
  <table style="width:100%;border-collapse:collapse;margin-bottom:28px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
    ${items
      .map(
        (li) => `
    <tr>
      <td style="padding:12px 20px;font-size:14px;color:#0f172a;border-bottom:1px solid #e2e8f0;">${li.description}</td>
      <td style="padding:12px 20px;font-size:14px;color:#0f172a;font-weight:600;text-align:right;border-bottom:1px solid #e2e8f0;white-space:nowrap;">₹${li.amount}</td>
    </tr>`
      )
      .join('')}
    <tr>
      <td style="padding:14px 20px;font-size:15px;color:#0f172a;font-weight:700;">Total</td>
      <td style="padding:14px 20px;font-size:15px;color:#0f172a;font-weight:700;text-align:right;white-space:nowrap;">₹${total}</td>
    </tr>
  </table>`

const metaRow = (label: string, value: string): string => `
  <tr>
    <td style="padding:4px 0;font-size:13px;color:#94a3b8;white-space:nowrap;padding-right:24px;">${label}</td>
    <td style="padding:4px 0;font-size:13px;color:#0f172a;font-weight:600;">${value}</td>
  </tr>`

export type InvoiceGeneratedPayload = {
  studentName: string
  mentorName: string
  invoiceNumber: string
  periodLabel: string
  lineItems: InvoiceLineItemView[]
  total: number
}

/** Student: a new invoice for your completed classes is due. */
export const invoiceGeneratedTemplate = (p: InvoiceGeneratedPayload): string =>
  emailLayout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">Your class fee is due</h1>
    <p style="margin:0 0 24px;color:#64748b;">
      Hi ${p.studentName}, here is your fee summary for classes with
      ${p.mentorName} — <strong>${p.periodLabel}</strong>.
    </p>

    <table style="margin:0 0 20px;">
      ${metaRow('Invoice no.', p.invoiceNumber)}
      ${metaRow('Period', p.periodLabel)}
    </table>

    ${lineItemsTable(p.lineItems, p.total)}

    <p style="margin:0 0 24px;color:#64748b;">
      Our team will collect this payment from you — no online payment is
      required.
    </p>

    <div style="text-align:center;">
      ${emailButton('View my bookings', `${APP_URL}/app/bookings`)}
    </div>
  `)

export type PaymentReceiptPayload = {
  studentName: string
  mentorName: string
  receiptNumber: string
  invoiceNumber?: string
  periodLabel: string
  lineItems: InvoiceLineItemView[]
  total: number
  method: string
  collectedAt: string // formatted date
}

/** Student: official receipt after the admin records/approves a payment. */
export const paymentReceiptTemplate = (p: PaymentReceiptPayload): string =>
  emailLayout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">Payment receipt ✅</h1>
    <p style="margin:0 0 24px;color:#64748b;">
      Hi ${p.studentName}, we've received your payment for classes with
      ${p.mentorName}. Thank you! Keep this email as your receipt.
    </p>

    <table style="margin:0 0 20px;">
      ${metaRow('Receipt no.', p.receiptNumber)}
      ${p.invoiceNumber ? metaRow('Invoice no.', p.invoiceNumber) : ''}
      ${metaRow('Period', p.periodLabel)}
      ${metaRow('Paid on', p.collectedAt)}
      ${metaRow('Method', p.method)}
    </table>

    ${lineItemsTable(p.lineItems, p.total)}

    <div style="text-align:center;">
      ${emailButton('View my bookings', `${APP_URL}/app/bookings`)}
    </div>
  `)

export type SettlementRecordedPayload = {
  mentorName: string
  settlementNumber: string
  amount: number
  invoiceCount: number
  method: string
  reference?: string
  paidAt: string // formatted date
}

/** Mentor: your payout has been recorded. */
export const settlementRecordedTemplate = (
  p: SettlementRecordedPayload
): string =>
  emailLayout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">Payout recorded 💸</h1>
    <p style="margin:0 0 24px;color:#64748b;">
      Hi ${p.mentorName}, a payout of <strong>₹${p.amount}</strong> covering
      ${p.invoiceCount} invoice${p.invoiceCount === 1 ? '' : 's'} has been
      recorded for you.
    </p>

    <table style="margin:0 0 28px;">
      ${metaRow('Settlement no.', p.settlementNumber)}
      ${metaRow('Paid on', p.paidAt)}
      ${metaRow('Method', p.method)}
      ${p.reference ? metaRow('Reference', p.reference) : ''}
    </table>

    <div style="text-align:center;">
      ${emailButton('View my earnings', `${APP_URL}/mentor/earnings`)}
    </div>
  `)
