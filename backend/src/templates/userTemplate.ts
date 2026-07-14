import { APP_URL, emailButton, emailLayout } from './emailLayout'

export const userTemplate = (data: { email: string; pass: string }): string =>
  emailLayout(`
    <h1 style="margin:0 0 8px;font-size:22px;color:#0f172a;">Welcome to Scholar Hub 🎓</h1>
    <p style="margin:0 0 24px;color:#64748b;">
      Your account is ready. Use the credentials below to sign in and get started.
    </p>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px 20px;margin-bottom:28px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;margin-bottom:4px;">Email</div>
      <div style="font-family:monospace;font-size:15px;color:#0f172a;margin-bottom:16px;word-break:break-all;">${data.email}</div>
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;margin-bottom:4px;">Password</div>
      <div style="font-family:monospace;font-size:15px;font-weight:700;color:#0f172a;">${data.pass}</div>
    </div>

    <div style="text-align:center;">
      ${emailButton('Log in to Scholar Hub', `${APP_URL}/login`)}
    </div>

    <p style="margin:26px 0 0;font-size:13px;color:#94a3b8;">
      For your security, please change your password after your first login.
    </p>
  `)
