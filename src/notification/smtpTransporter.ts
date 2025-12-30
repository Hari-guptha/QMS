import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import fs from 'fs';
import path from 'path';

let currentConfig: any = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  user: process.env.SMTP_EMAIL,
  pass: process.env.SMTP_PASSWORD,
  fromEmail: process.env.SMTP_EMAIL || 'noreply@example.com',
  fromName: process.env.SMTP_FROM_NAME || 'QMS System',
};

let transporter: nodemailer.Transporter | null = null;

export function setConfig(cfg: Partial<typeof currentConfig>) {
  currentConfig = { ...currentConfig, ...cfg };
  transporter = null; // reset
}

export async function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: currentConfig.host,
    port: currentConfig.port,
    secure: currentConfig.port === 465,
    auth: currentConfig.user && currentConfig.pass ? { user: currentConfig.user, pass: currentConfig.pass } : undefined,
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
  // provide default from if not given
  if (!opts.from) opts.from = `${currentConfig.fromName} <${currentConfig.fromEmail}>`;
  return t.sendMail(opts);
}
