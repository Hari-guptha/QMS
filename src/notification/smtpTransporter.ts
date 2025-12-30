import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import fs from 'fs';
import path from 'path';

const DEFAULT_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  user: process.env.SMTP_EMAIL,
  pass: process.env.SMTP_PASSWORD,
  fromEmail: process.env.SMTP_EMAIL || 'noreply@example.com',
  fromName: process.env.SMTP_FROM_NAME || 'QMS System',
};

let transporter: nodemailer.Transporter | null = null;

export async function getTransporter() {
  if (transporter) return transporter;
  // build from env or config file
  transporter = nodemailer.createTransport({
    host: DEFAULT_CONFIG.host,
    port: DEFAULT_CONFIG.port,
    secure: DEFAULT_CONFIG.port === 465,
    auth: DEFAULT_CONFIG.user && DEFAULT_CONFIG.pass ? { user: DEFAULT_CONFIG.user, pass: DEFAULT_CONFIG.pass } : undefined,
    tls: { rejectUnauthorized: false },
  } as SMTPTransport.Options);

  try {
    await transporter.verify();
  } catch (e) {
    console.warn('[smtpTransporter] verify failed', e.message || e);
  }

  return transporter;
}

export async function sendMail(opts: any) {
  const t = await getTransporter();
  return t.sendMail(opts);
}
