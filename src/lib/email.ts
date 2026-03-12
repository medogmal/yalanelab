import nodemailer from "nodemailer";

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    return null;
  }
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendEmail(to: string, subject: string, html: string) {
  const transporter = getTransport();
  if (!transporter) {
    return { ok: false, error: "smtp_not_configured" };
  }
  const from = process.env.SMTP_FROM || "no-reply@nelab-yalla.local";
  await transporter.sendMail({ from, to, subject, html });
  return { ok: true };
}
