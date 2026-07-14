// Shared email chrome (logo header + footer) and helpers. The frontend URL is
// environment-aware: set FRONTEND_URL per environment (dev → the dev site,
// prod → https://www.scholarhub.live). Falls back to production.
export const APP_URL = (
  process.env.FRONTEND_URL || 'https://www.scholarhub.live'
).replace(/\/+$/, '')

const LOGO_URL = `${APP_URL}/og-image.png`

/** Brand CTA button (inline-styled for email-client compatibility). */
export const emailButton = (label: string, href: string): string =>
  `<a href="${href}" target="_blank" style="display:inline-block;background:#2563EB;color:#ffffff;text-decoration:none;padding:13px 30px;border-radius:10px;font-weight:700;font-size:15px;">${label}</a>`

/** Wrap page content in the branded email shell (header logo + footer). */
export const emailLayout = (content: string): string => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Scholar Hub</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
    <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
      <!-- logo -->
      <div style="text-align:center;padding:4px 0 24px;">
        <a href="${APP_URL}" target="_blank" style="text-decoration:none;">
          <img src="${LOGO_URL}" alt="Scholar Hub" width="120" style="display:inline-block;width:120px;max-width:120px;height:auto;border:0;" />
        </a>
      </div>

      <!-- card -->
      <div style="background:#ffffff;border-radius:16px;box-shadow:0 4px 16px rgba(15,23,42,0.06);overflow:hidden;">
        <div style="height:6px;background:#2563EB;background:linear-gradient(90deg,#2563EB,#1E40AF,#7C3AED);"></div>
        <div style="padding:36px 32px;color:#334155;font-size:15px;line-height:1.65;">
          ${content}
        </div>
      </div>

      <!-- footer -->
      <div style="text-align:center;padding:24px 8px 8px;color:#94a3b8;font-size:12px;line-height:1.8;">
        <div style="margin-bottom:8px;">
          <a href="${APP_URL}/mentors" style="color:#64748b;text-decoration:none;margin:0 8px;">Find Mentors</a>
          <a href="${APP_URL}/about" style="color:#64748b;text-decoration:none;margin:0 8px;">About</a>
          <a href="${APP_URL}/contact-us" style="color:#64748b;text-decoration:none;margin:0 8px;">Contact</a>
        </div>
        <div>&copy; ${new Date().getFullYear()} Scholar Hub &middot; Gateway to expert learning</div>
        <div style="margin-top:6px;color:#cbd5e1;">This is an automated message — please do not reply.</div>
      </div>
    </div>
  </body>
</html>`
