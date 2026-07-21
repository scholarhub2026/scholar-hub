/**
 * Test stub for `utils/mailService`. Records calls (so tests can assert an
 * email "was sent") without touching Brevo/SendGrid/SMTP.
 */
export type MailType =
  | 'otp'
  | 'user'
  | 'bookingApproved'
  | 'bookingApprovedMentor'
  | 'bookingRejected'
  | 'paymentReminder'
  | 'paymentDueDigest'
  | 'teacherAcceptRequest'
  | 'bookingAwaitingTeacher'
  | 'teacherAccepted'
  | 'teacherDeclined'
  | 'invoiceGenerated'
  | 'paymentReceipt'
  | 'settlementRecorded'
  | 'classEnquiry'

export const sentMails: Array<{ to: string; subject: string; type: MailType }> = []

export const sendMail = async (
  to: string,
  subject: string,
  type: MailType,
  _data: any
) => {
  sentMails.push({ to, subject, type })
  return { success: true }
}
