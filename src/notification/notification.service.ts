import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import { Resend } from 'resend';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private twilioClient: twilio.Twilio;
  private resend: Resend;

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
      if (!this.resend) {
        this.logger.warn('Resend not configured, email not sent');
        return;
      }

      const from = this.configService.get('RESEND_FROM_EMAIL');
      if (!from) {
        this.logger.warn('Resend from email not configured');
        return;
      }

      await this.resend.emails.send({
        from,
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}:`, error);
      // Don't throw - notification failures shouldn't break the flow
    }
  }
}

