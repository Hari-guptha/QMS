import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as cryptoUtil from '../utils/crypto.util';

@Injectable()
export class NotificationRepository {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  private encryptionSecret(): string {
    return this.config.get<string>('NOTIF_ENCRYPTION_SECRET') || process.env.NOTIF_ENCRYPTION_SECRET || 'default_secret_change_me';
  }

  async getSettings() {
    const row = await this.prisma.notificationSetting.findFirst();
    if (!row) return null;
    const secret = this.encryptionSecret();
    return {
      id: row.id,
      method: row.method,
      smtpHost: row.smtpHost,
      smtpPort: row.smtpPort,
      smtpUser: row.smtpUser,
      smtpPass: row.smtpPassEncrypted ? cryptoUtil.decrypt(row.smtpPassEncrypted, secret) : null,
      smtpFromEmail: row.smtpFromEmail,
      smtpFromName: row.smtpFromName,
      twilioAccountSid: row.twilioAccountSidEnc ? cryptoUtil.decrypt(row.twilioAccountSidEnc, secret) : null,
      twilioAuthToken: row.twilioAuthTokenEnc ? cryptoUtil.decrypt(row.twilioAuthTokenEnc, secret) : null,
      twilioFromNumber: row.twilioFromNumber,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async upsertSettings(dto: any) {
    const secret = this.encryptionSecret();
      const existing = await this.prisma.notificationSetting.findFirst();
    const data: any = {
      method: dto.method || 'sms',
      smtpHost: dto.smtpHost || null,
      smtpPort: dto.smtpPort ? Number(dto.smtpPort) : null,
      smtpUser: dto.smtpUser || null,
      smtpPassEncrypted: dto.smtpPass ? cryptoUtil.encrypt(dto.smtpPass, secret) : existing?.smtpPassEncrypted || null,
      smtpFromEmail: dto.smtpFromEmail || null,
      smtpFromName: dto.smtpFromName || null,
      twilioAccountSidEnc: dto.twilioAccountSid ? cryptoUtil.encrypt(dto.twilioAccountSid, secret) : existing?.twilioAccountSidEnc || null,
      twilioAuthTokenEnc: dto.twilioAuthToken ? cryptoUtil.encrypt(dto.twilioAuthToken, secret) : existing?.twilioAuthTokenEnc || null,
      twilioFromNumber: dto.twilioFromNumber || null,
    };

    if (existing) {
        return this.prisma.notificationSetting.update({ where: { id: existing.id }, data });
    }
      return this.prisma.notificationSetting.create({ data });
  }
}

export default NotificationRepository;
