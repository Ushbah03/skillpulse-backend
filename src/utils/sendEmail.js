import nodemailer from 'nodemailer';

/**
 * Send transactional emails via SMTP (e.g. Gmail, Resend, SendGrid, Mailtrap)
 * Falls back safely if SMTP credentials are missing without breaking app execution.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM || (user ? `SkillPulse AI <${user}>` : '"SkillPulse AI" <no-reply@skillpulse.ai>');

  if (!user || !pass) {
    console.warn(`[SMTP Warning] SMTP credentials (SMTP_USER / SMTP_PASS) not configured in env. Email to ${to} simulated.`);
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
    // Return gracefully so user reset flow isn't crashed by external email server timeouts
    return { success: false, error: error.message };
  }
};
