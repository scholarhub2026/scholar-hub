import { emailLayout } from './emailLayout'

export const otpTemplate = (otp: string): string =>
  emailLayout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">Verify your email</h1>
    <p style="margin:0 0 24px;color:#64748b;">
      Use the following one-time code to complete your verification:
    </p>

    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;font-size:30px;font-weight:800;letter-spacing:8px;color:#1E40AF;background:#eff6ff;border:1px solid #dbeafe;padding:16px 28px;border-radius:12px;">
        ${otp}
      </div>
    </div>

    <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">
      This code is valid for 10 minutes. Never share it with anyone.
    </p>
  `)
