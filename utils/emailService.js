import nodemailer from "nodemailer";

// ── Transporter (Gmail SMTP) ──────────────────────────────────────────────────
// Uses Gmail with an App Password.
// To get an App Password:
//   1. Enable 2-Step Verification on your Google account
//   2. Go to https://myaccount.google.com/apppasswords
//   3. Generate a new app password for "Mail"
//   4. Add it to .env as EMAIL_PASS

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send a 6-digit OTP email for password reset.
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - The 6-digit OTP code
 * @param {string} userName - User's name for personalisation
 */
export async function sendOtpEmail(toEmail, otp, userName = "User") {
  const mailOptions = {
    from: `"JobZone" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Password Reset – Your OTP Code",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 520px; margin: 0 auto; padding: 0;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #004ae4, #0066ff); padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: -0.5px;">
            <span style="color: #F5BF22;">JOB</span><span style="color: #ffffff;">ZONE</span>
          </h1>
        </div>

        <!-- Body -->
        <div style="background: #ffffff; padding: 32px 24px; border: 1px solid #e2e8f0; border-top: none;">
          <h2 style="color: #1a1a2e; margin: 0 0 8px; font-size: 20px;">Password Reset Request</h2>
          <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
            Hi <strong>${userName}</strong>, we received a request to reset your password. Use the OTP code below to proceed:
          </p>

          <!-- OTP Box -->
          <div style="background: #f8fafc; border: 2px dashed #004ae4; border-radius: 10px; padding: 20px; text-align: center; margin: 0 0 24px;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #004ae4;">${otp}</span>
          </div>

          <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 0 0 8px;">
            ⏱ This code expires in <strong>10 minutes</strong>.
          </p>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f1f5f9; padding: 16px 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            © 2026 JobZone. All rights reserved.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
