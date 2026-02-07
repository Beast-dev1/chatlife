import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || "noreply@letschat.app";

function getTransporter() {
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    return nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }
  return null;
}

export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
): Promise<void> {
  const transporter = getTransporter();

  const mailOptions = {
    from: SMTP_FROM,
    to: email,
    subject: "Reset your Let'sChat password",
    text: `You requested a password reset. Click the link below to set a new password:\n\n${resetLink}\n\nThis link expires in 1 hour. If you did not request this, please ignore this email.`,
    html: `
      <p>You requested a password reset.</p>
      <p><a href="${resetLink}">Click here to set a new password</a></p>
      <p>This link expires in 1 hour. If you did not request this, please ignore this email.</p>
    `,
  };

  if (transporter) {
    await transporter.sendMail(mailOptions);
  } else {
    // Development fallback: log the reset link to console
    console.log("[Email] Password reset link (SMTP not configured):");
    console.log(`  To: ${email}`);
    console.log(`  Link: ${resetLink}`);
  }
}
