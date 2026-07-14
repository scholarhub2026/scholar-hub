import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

import { userTemplate } from "../templates/userTemplate";
import { transporter } from "./nodemailler";
import { otpTemplate } from "../templates/otpTemplates";

dotenv.config();

const hasSendGrid = !!process.env.SENDGRID_API_KEY;
const hasSmtp = !!process.env.MAIL_HOST && !!process.env.MAIL_USER;

if (hasSendGrid) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
}

export type MailType = "otp" | "user";
type UserPayload = { email: string; pass: string };

/**
 * Send email via SendGrid when configured, else plain SMTP (MAIL_* vars —
 * e.g. a Gmail app password). Throws if delivery fails or nothing is
 * configured, so callers can surface "email not sent" to the user.
 */
export const sendMail = async (
  recipient: string,
  subject: string,
  type: MailType,
  payload: string | UserPayload
): Promise<void> => {
  const html = getHtmlContent(type, payload);

  if (!hasSendGrid && !hasSmtp) {
    throw new Error(
      "No email service configured (set SENDGRID_API_KEY or MAIL_HOST/MAIL_USER/MAIL_PASS)"
    );
  }

  if (hasSendGrid) {
    try {
      await sgMail.send({
        to: recipient,
        from: process.env.MAIL_FROM!,
        subject,
        html,
      });
      console.log(`✅ Email sent to ${recipient} via SendGrid`);
      return;
    } catch (error: any) {
      const reason =
        error.response?.body?.errors?.[0]?.message || error.message || "unknown";
      console.error("❌ SendGrid error:", error.response?.body || error.message);
      if (!hasSmtp) throw new Error(`SendGrid: ${reason}`);
      // fall through to SMTP
    }
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.MAIL_USER,
      to: recipient,
      subject,
      html,
    });
    console.log(`📬 Email sent to ${recipient} via SMTP: ${info.messageId}`);
  } catch (fallbackError: any) {
    console.error("🚨 SMTP email failed:", fallbackError.message);
    // Surface the real reason (e.g. "Invalid login: 535 …") to the caller.
    throw new Error(`SMTP: ${fallbackError?.message || "delivery failed"}`);
  }
};

/**
 * Get HTML template based on email type.
 */
const getHtmlContent = (
  type: MailType,
  payload: string | UserPayload
): string => {
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

    default:
      throw new Error("Unsupported mail type");
  }
};
