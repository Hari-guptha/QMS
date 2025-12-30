import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import { Resend } from 'resend';
import * as emailSender from './emailSender';
import { setConfig as setSmtpConfig } from './smtpTransporter';
import { NotificationRepository } from './notification.repository';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private twilioClient: twilio.Twilio;
  private resend: Resend;

  constructor(private configService: ConfigService, private repo: NotificationRepository) {}

  async getMethod() {
    const cfg = await this.repo.getSettings();
    return cfg?.method || 'sms';
  }

  async sendSMS(to: string, message: string): Promise<void> {
    try {
      const cfg = await this.repo.getSettings();
      if (!cfg || !cfg.twilioAccountSid || !cfg.twilioAuthToken) {
        this.logger.warn('Twilio not configured, SMS not sent');
        return;
      }
      if (!this.twilioClient) {
        try {
          this.twilioClient = twilio(cfg.twilioAccountSid, cfg.twilioAuthToken);
        } catch (e) {
          this.logger.warn('Failed to initialize Twilio client', e.message);
          return;
        }
      }
      const from = cfg.twilioFromNumber;
      if (!from) {
        this.logger.warn('Twilio phone number not configured');
        return;
      }
      await this.twilioClient.messages.create({ body: message, from, to });
      this.logger.log(`SMS sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}:`, error);
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    try {
      const cfg = await this.repo.getSettings();
      if (!cfg) {
        this.logger.log('No notification settings; skipping email');
        return;
      }
      if (cfg.method === 'sms') {
        this.logger.log('Notification method is SMS; skipping email send');
        return;
      }

      // Prefer Resend if configured via env
      const resendApiKey = this.configService.get('RESEND_API_KEY');
      if (resendApiKey && !resendApiKey.includes('your-') && resendApiKey.length > 20) {
        try {
          if (!this.resend) this.resend = new Resend(resendApiKey);
          const from = cfg.smtpFromEmail || this.configService.get('RESEND_FROM_EMAIL');
          if (!from) this.logger.warn('Resend from email not configured');
          else {
            await this.resend.emails.send({ from, to, subject, html });
            this.logger.log(`Email sent to ${to} via Resend`);
            return;
          }
        } catch (e) {
          this.logger.error('Resend template send failed', e);
        }
      }

      // Fallback to SMTP sender (emailSender) - emailSender will pick SMTP from DB config
      try {
        // apply DB SMTP config to transporter
        if (cfg.smtpHost) {
          setSmtpConfig({ host: cfg.smtpHost, port: cfg.smtpPort || 587, user: cfg.smtpUser, pass: cfg.smtpPass, fromEmail: cfg.smtpFromEmail, fromName: cfg.smtpFromName });
        }
        await emailSender.sendSimpleEmail(to, subject, html);
        this.logger.log(`Email sent to ${to} via SMTP`);
      } catch (err) {
        this.logger.error('SMTP send failed', err);
      }
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
    }
  }

  async sendTemplate(to: string, subject: string, templateName: string, data: Record<string, any>, from?: { name?: string; email?: string }) {
    const cfg = await this.repo.getSettings();
    if (!cfg || cfg.method === 'sms') {
      this.logger.log('Notification method is SMS; skipping template email');
      return;
    }
    // Use template rendering + SMTP if Resend not available
    if (this.resend) {
      const html = await (async () => {
        // try to use local template service through emailSender
        try {
          const tpl = await (require('./template.service').default.render(templateName, data));
          return tpl;
        } catch (e) {
          return data.content || '';
        }
      })();
      try {
        const fromLine = from?.email ? `${from.name || ''} <${from.email}>` : this.configService.get('RESEND_FROM_EMAIL');
        await this.resend.emails.send({ from: fromLine, to, subject, html });
        this.logger.log(`Template email sent to ${to} via Resend`);
        return;
      } catch (e) {
        this.logger.error('Resend template send failed', e);
      }
    }

    // Fallback to SMTP template send
    try {
      if (cfg.smtpHost) {
        setSmtpConfig({ host: cfg.smtpHost, port: cfg.smtpPort || 587, user: cfg.smtpUser, pass: cfg.smtpPass, fromEmail: cfg.smtpFromEmail, fromName: cfg.smtpFromName });
      }
      await (emailSender as any).sendTemplateEmail(to, subject, templateName, data, from);
    } catch (e) {
      this.logger.error('SMTP template send failed', e);
    }
  }
}

