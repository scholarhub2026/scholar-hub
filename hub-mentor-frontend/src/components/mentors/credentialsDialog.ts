import Swal from "sweetalert2";

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );

/**
 * Shared "mentor credentials" dialog for the approve + resend flows.
 * Shows the credentials on-screen (with a copy button) and honestly reports
 * whether the email actually went out — including the failure reason.
 */
export const showCredentialsDialog = (
  creds: { email: string; password: string },
  emailSent?: boolean,
  emailError?: string | null,
) => {
  const loginUrl = `${window.location.origin}/login`;
  const credsText = `Scholar Hub login\nEmail: ${creds.email}\nPassword: ${creds.password}\nLogin at: ${loginUrl}`;

  const emailNotConfigured =
    !emailError || /no email service/i.test(emailError);

  let note: string;
  if (emailSent) {
    note =
      "Credentials were emailed to the mentor. They're also shown here in case the email doesn't arrive:";
  } else if (emailNotConfigured) {
    // Manual mode — email intentionally not set up. Keep it calm, not alarming.
    note =
      "Share these login credentials with the mentor directly (WhatsApp / email):";
  } else {
    note = `⚠️ The credentials email could <b>not</b> be sent — <i>${escapeHtml(
      emailError!,
    )}</i>. Share these with the mentor manually (WhatsApp / email):`;
  }

  return Swal.fire({
    title: "Mentor credentials",
    icon: emailSent ? "success" : emailNotConfigured ? "info" : "warning",
    html: `
      <p style="margin-bottom:10px;font-size:14px;color:#475569">${note}</p>
      <div style="text-align:left;background:#f1f5f9;border-radius:10px;padding:14px;font-family:monospace;font-size:14px">
        <div><b>Email:</b> ${escapeHtml(creds.email)}</div>
        <div><b>Password:</b> ${escapeHtml(creds.password)}</div>
      </div>
      <p style="margin-top:10px;font-size:12px;color:#94a3b8">
        This password is shown only once — copy it now.
      </p>`,
    showCancelButton: true,
    confirmButtonText: "Copy credentials",
    cancelButtonText: "Close",
    confirmButtonColor: "#2563EB",
  }).then((r) => {
    if (r.isConfirmed) {
      navigator.clipboard
        .writeText(credsText)
        .then(() =>
          Swal.fire({
            title: "Copied!",
            text: "Credentials copied to clipboard.",
            icon: "success",
            timer: 1500,
            showConfirmButton: false,
          }),
        )
        .catch(() => {});
    }
  });
};
