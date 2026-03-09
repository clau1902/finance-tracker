import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "localhost",
  port: parseInt(process.env.SMTP_PORT ?? "1025"),
  secure: false,
  auth:
    process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
});

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string
): Promise<void> {
  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? "FinanceTrack <noreply@financetrack.local>",
    to,
    subject: "Reset your FinanceTrack password",
    text: `You requested a password reset.\n\nClick the link below to choose a new password (valid for 1 hour):\n\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;background:#f4f4f5;margin:0;padding:32px 16px;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #e4e4e7;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
      <div style="width:36px;height:36px;border-radius:8px;background:#0d9488;display:inline-flex;align-items:center;justify-content:center;">
        <span style="color:#fff;font-size:18px;line-height:1;">↑</span>
      </div>
      <span style="font-weight:600;font-size:18px;color:#09090b;">FinanceTrack</span>
    </div>
    <h1 style="font-size:20px;font-weight:600;color:#09090b;margin:0 0 8px;">Reset your password</h1>
    <p style="color:#71717a;font-size:14px;margin:0 0 24px;line-height:1.6;">
      We received a request to reset the password for your account. Click the button below to choose a new password. This link is valid for <strong>1 hour</strong>.
    </p>
    <a href="${resetUrl}" style="display:inline-block;background:#0d9488;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:500;font-size:14px;">
      Reset password
    </a>
    <p style="color:#a1a1aa;font-size:12px;margin:24px 0 0;line-height:1.6;">
      If you did not request a password reset, you can safely ignore this email. Your password will not change.
    </p>
  </div>
</body>
</html>`,
  });
}
