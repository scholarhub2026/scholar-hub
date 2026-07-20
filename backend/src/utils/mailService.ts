import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

import { userTemplate } from "../templates/userTemplate";
import { transporter } from "./nodemailler";
import { otpTemplate } from "../templates/otpTemplates";
import {
  bookingApprovedTemplate,
  bookingApprovedMentorTemplate,
  bookingRejectedTemplate,
  type BookingApprovedPayload,
  type BookingApprovedMentorPayload,
  type BookingRejectedPayload,
} from "../templates/bookingStatusTemplates";
import {
  paymentReminderTemplate,
  paymentDueDigestTemplate,
  type PaymentReminderPayload,
  type PaymentDueDigestPayload,
} from "../templates/paymentTemplates";
import {
  teacherAcceptRequestTemplate,
  bookingAwaitingTeacherTemplate,
  teacherAcceptedTemplate,
  teacherDeclinedTemplate,
  type TeacherAcceptRequestPayload,
  type BookingAwaitingTeacherPayload,
  type TeacherAcceptedPayload,
  type TeacherDeclinedPayload,
} from "../templates/bookingLifecycleTemplates";
import {
  invoiceGeneratedTemplate,
  paymentReceiptTemplate,
  settlementRecordedTemplate,
  type InvoiceGeneratedPayload,
  type PaymentReceiptPayload,
  type SettlementRecordedPayload,
} from "../templates/receiptTemplates";

dotenv.config();

const BREVO_KEY = process.env.BREVO_API_KEY;
const SENDGRID_KEY = process.env.SENDGRID_API_KEY;
const hasSmtp = !!process.env.MAIL_HOST && !!process.env.MAIL_USER;
const FROM = process.env.MAIL_FROM || process.env.MAIL_USER || "";

if (SENDGRID_KEY) sgMail.setApiKey(SENDGRID_KEY);

export type MailType =
  | "otp"
  | "user"
  | "bookingApproved"
  | "bookingApprovedMentor"
  | "bookingRejected"
  | "paymentReminder"
  | "paymentDueDigest"
  | "teacherAcceptRequest"
  | "bookingAwaitingTeacher"
  | "teacherAccepted"
  | "teacherDeclined"
  | "invoiceGenerated"
  | "paymentReceipt"
  | "settlementRecorded";
type UserPayload = { email: string; pass: string };
type MailPayload =
  | string
  | UserPayload
  | BookingApprovedPayload
  | BookingApprovedMentorPayload
  | BookingRejectedPayload
  | PaymentReminderPayload
  | PaymentDueDigestPayload
  | TeacherAcceptRequestPayload
  | BookingAwaitingTeacherPayload
  | TeacherAcceptedPayload
  | TeacherDeclinedPayload
  | InvoiceGeneratedPayload
  | PaymentReceiptPayload
  | SettlementRecordedPayload;

// --- Providers. HTTP-API ones (Brevo, SendGrid) work on hosts that block
// outbound SMTP ports (Railway, Render, …); plain SMTP is kept for local/other
// hosts. Each throws with a specific reason on failure. ---

const sendViaBrevo = async (to: string, subject: string, html: string) => {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_KEY as string,
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { email: FROM, name: "Scholar Hub" },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo ${res.status}: ${body.slice(0, 200)}`);
  }
};

const sendViaSendGrid = async (to: string, subject: string, html: string) => {
  try {
    await sgMail.send({ to, from: FROM, subject, html });
  } catch (e: any) {
    const reason = e.response?.body?.errors?.[0]?.message || e.message || "unknown";
    throw new Error(`SendGrid: ${reason}`);
  }
};

const sendViaSmtp = async (to: string, subject: string, html: string) => {
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
  } catch (e: any) {
    throw new Error(`SMTP: ${e?.message || "delivery failed"}`);
  }
};

/**
 * Send an email, trying each configured provider in order (Brevo → SendGrid →
 * SMTP). Throws with the last provider's specific reason if all fail, so the
 * caller can surface it. Emails are optional to the app — callers catch this.
 */
export const sendMail = async (
  recipient: string,
  subject: string,
  type: MailType,
  payload: MailPayload
): Promise<void> => {
  const html = getHtmlContent(type, payload);

  const providers: Array<[string, () => Promise<void>]> = [];
  if (BREVO_KEY) providers.push(["Brevo", () => sendViaBrevo(recipient, subject, html)]);
  if (SENDGRID_KEY)
    providers.push(["SendGrid", () => sendViaSendGrid(recipient, subject, html)]);
  if (hasSmtp) providers.push(["SMTP", () => sendViaSmtp(recipient, subject, html)]);

  if (providers.length === 0) {
    throw new Error(
      "No email service configured (set BREVO_API_KEY, SENDGRID_API_KEY, or MAIL_HOST/MAIL_USER/MAIL_PASS)"
    );
  }

  let lastErr: Error | null = null;
  for (const [name, fn] of providers) {
    try {
      await fn();
      console.log(`✅ Email sent to ${recipient} via ${name}`);
      return;
    } catch (err: any) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      console.error(`❌ ${name} failed:`, lastErr.message);
    }
  }
  throw lastErr ?? new Error("Email delivery failed");
};

/**
 * Get HTML template based on email type.
 */
const getHtmlContent = (type: MailType, payload: MailPayload): string => {
  switch (type) {
    case "otp":
      if (typeof payload !== "string") {
        throw new Error("Invalid OTP payload: must be a string");
      }
      return otpTemplate(payload);

    case "user":
      if (typeof payload !== "object" || !("email" in payload && "pass" in payload)) {
        throw new Error("Invalid User payload: must include email and pass");
      }
      return userTemplate(payload);

    case "bookingApproved":
      if (typeof payload !== "object" || !("firstDueDate" in payload)) {
        throw new Error("Invalid bookingApproved payload");
      }
      return bookingApprovedTemplate(payload);

    case "bookingApprovedMentor":
      if (typeof payload !== "object" || !("detail" in payload)) {
        throw new Error("Invalid bookingApprovedMentor payload");
      }
      return bookingApprovedMentorTemplate(payload as BookingApprovedMentorPayload);

    case "bookingRejected":
      if (typeof payload !== "object" || !("mentorName" in payload)) {
        throw new Error("Invalid bookingRejected payload");
      }
      return bookingRejectedTemplate(payload as BookingRejectedPayload);

    case "paymentReminder":
      if (typeof payload !== "object" || !("dueDate" in payload)) {
        throw new Error("Invalid paymentReminder payload");
      }
      return paymentReminderTemplate(payload as PaymentReminderPayload);

    case "paymentDueDigest":
      if (typeof payload !== "object" || !("items" in payload)) {
        throw new Error("Invalid paymentDueDigest payload");
      }
      return paymentDueDigestTemplate(payload);

    case "teacherAcceptRequest":
      if (typeof payload !== "object" || !("detail" in payload && "frequency" in payload)) {
        throw new Error("Invalid teacherAcceptRequest payload");
      }
      return teacherAcceptRequestTemplate(payload as TeacherAcceptRequestPayload);

    case "bookingAwaitingTeacher":
      if (typeof payload !== "object" || !("mentorName" in payload)) {
        throw new Error("Invalid bookingAwaitingTeacher payload");
      }
      return bookingAwaitingTeacherTemplate(payload as BookingAwaitingTeacherPayload);

    case "teacherAccepted":
      if (typeof payload !== "object" || !("billingLine" in payload)) {
        throw new Error("Invalid teacherAccepted payload");
      }
      return teacherAcceptedTemplate(payload as TeacherAcceptedPayload);

    case "teacherDeclined":
      if (typeof payload !== "object" || !("mentorName" in payload)) {
        throw new Error("Invalid teacherDeclined payload");
      }
      return teacherDeclinedTemplate(payload as TeacherDeclinedPayload);

    case "invoiceGenerated":
      if (typeof payload !== "object" || !("invoiceNumber" in payload)) {
        throw new Error("Invalid invoiceGenerated payload");
      }
      return invoiceGeneratedTemplate(payload as InvoiceGeneratedPayload);

    case "paymentReceipt":
      if (typeof payload !== "object" || !("receiptNumber" in payload)) {
        throw new Error("Invalid paymentReceipt payload");
      }
      return paymentReceiptTemplate(payload as PaymentReceiptPayload);

    case "settlementRecorded":
      if (typeof payload !== "object" || !("settlementNumber" in payload)) {
        throw new Error("Invalid settlementRecorded payload");
      }
      return settlementRecordedTemplate(payload as SettlementRecordedPayload);

    default:
      throw new Error("Unsupported mail type");
  }
};
