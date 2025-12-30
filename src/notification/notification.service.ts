import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';
import * as emailSender from './emailSender';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private twilioClient: twilio.Twilio;
  private resend: Resend;
  private CONFIG_PATH = path.join(process.cwd(), 'src', 'notification', 'notification.config.json');

  constructor(private configService: ConfigService) {
    // Initialize Twilio only if valid credentials are provided
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    
    // Only initialize if credentials are valid (not placeholders and proper format)
    if (
      accountSid &&
      authToken &&
      accountSid.startsWith('AC') &&
      !accountSid.includes('your-') &&
      !authToken.includes('your-')
    ) {
      try {
        this.twilioClient = twilio(accountSid, authToken);
        this.logger.log('Twilio client initialized');
      } catch (error) {
        this.logger.warn('Failed to initialize Twilio client:', error.message);
      }
    } else {
      this.logger.log('Twilio not configured (using placeholder values or missing credentials)');
    }

    // Initialize Resend only if valid API key is provided
    const resendApiKey = this.configService.get('RESEND_API_KEY');
    if (resendApiKey && !resendApiKey.includes('your-') && resendApiKey.length > 20) {
      try {
        this.resend = new Resend(resendApiKey);
        this.logger.log('Resend client initialized');
      } catch (error) {
        this.logger.warn('Failed to initialize Resend client:', error.message);
      }
    } else {
      this.logger.log('Resend not configured (using placeholder values or missing credentials)');
    }
  }

  readConfig() {
    if (!fs.existsSync(this.CONFIG_PATH)) return { method: 'sms', smtp: {} };
    try {
      return JSON.parse(fs.readFileSync(this.CONFIG_PATH, 'utf-8'));
    } catch (e) {
      return { method: 'sms', smtp: {} };
    }
  }

  getMethod() {
    const cfg = this.readConfig();
    return cfg.method || 'sms';
  }

  async sendSMS(to: string, message: string): Promise<void> {
    try {
      if (!this.twilioClient) {
        this.logger.warn('Twilio not configured, SMS not sent');
        return;
      }

      const from = this.configService.get('TWILIO_PHONE_NUMBER');
      if (!from) {
        this.logger.warn('Twilio phone number not configured');
        return;
      }

      await this.twilioClient.messages.create({
        body: message,
        from,
        to,
      });

      this.logger.log(`SMS sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${to}:`, error);
      // Don't throw - notification failures shouldn't break the flow
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    try {
      const cfg = this.readConfig();
      // If config method is sms, skip sending email here
      if (cfg.method === 'sms') {
        this.logger.log('Notification method is SMS; skipping email send');
        return;
      }

      // Prefer Resend if configured
      if (this.resend) {
        const from = this.configService.get('RESEND_FROM_EMAIL');
        if (!from) {
          this.logger.warn('Resend from email not configured');
        } else {
          await this.resend.emails.send({ from, to, subject, html });
          this.logger.log(`Email sent to ${to} via Resend`);
          return;
        }
      }

      // Fallback to SMTP sender (emailSender)
      try {
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
    const cfg = this.readConfig();
    if (cfg.method === 'sms') {
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
      await (emailSender as any).sendTemplateEmail(to, subject, templateName, data, from);
    } catch (e) {
      this.logger.error('SMTP template send failed', e);
    }
  }
}

