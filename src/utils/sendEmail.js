import nodemailer from 'nodemailer';
import { Resend } from 'resend';

/**
 * Send transactional emails via Resend API or Nodemailer SMTP (e.g. Gmail)
 * Falls back safely if credentials are missing without breaking app execution.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const resendApiKey = process.env.RESEND_API_KEY;

  // 1. Try Resend API first if configured
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const data = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'SkillPulse AI <onboarding@resend.dev>',
        to,
        subject,
        html,
        text
      });
      console.log(`[Resend Email Dispatched] to ${to}:`, data);
      return { success: true, data };
    } catch (error) {
      console.error(`[Resend Dispatch Error] Failed to send email to ${to}:`, error.message);
    }
  }

  // 2. Try Nodemailer SMTP
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || (user ? `SkillPulse AI <${user}>` : '"SkillPulse AI" <no-reply@skillpulse.ai>');

  if (!user || !pass) {
    console.warn(`[SMTP Warning] SMTP credentials (RESEND_API_KEY / SMTP_USER / SMTP_PASS) not configured in env. Email to ${to} simulated.`);
    return { success: true, simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    console.log(`[Email Dispatched Successfully] MessageId: ${info.messageId} to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Dispatch Error] Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};
