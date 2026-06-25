import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

import { userTemplate } from "../templates/userTemplate";
import { transporter } from "./nodemailler";
import { otpTemplate } from "../templates/otpTemplates";

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export type MailType = "otp" | "user";
type UserPayload = { email: string; pass: string };

/**
 * Send email using SendGrid (preferred) or Nodemailer fallback.
 */
export const sendMail = async (
  recipient: string,
  subject: string,
  type: MailType,
  payload: string | UserPayload
): Promise<void> => {
  try {
    const html = getHtmlContent(type, payload);

    // ✅ Send via SendGrid
    await sgMail.send({
      to: recipient,
      from: process.env.MAIL_FROM!,
      subject,
      html,
    });

    console.log(`✅ Email sent successfully to ${recipient} via SendGrid`);
  } catch (error: any) {
    console.error("❌ SendGrid error:", error.response?.body || error.message);

    // 📨 Fallback to Nodemailer if SendGrid fails
    try {
      const mailOptions = {
        from: process.env.MAIL_FROM!,
        to: recipient,
        subject,
        html: getHtmlContent(type, payload),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`📬 Fallback email sent via Nodemailer: ${info.messageId}`);
    } catch (fallbackError: any) {
      console.error("🚨 Fallback email failed:", fallbackError.message);
      throw new Error("Email delivery failed via both SendGrid and Nodemailer");
    }
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
