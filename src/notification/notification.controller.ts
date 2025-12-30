import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { NotificationRepository } from './notification.repository';

@Controller('notification')
export class NotificationController {
  constructor(private repo: NotificationRepository) {}

  @Get('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getConfig() {
    const cfg = await this.repo.getSettings();
    if (!cfg) return { method: 'sms', smtp: {} };
    // hide secrets in response
    const safe = { ...cfg };
    delete safe.smtpPass;
    delete safe.twilioAccountSid;
    delete safe.twilioAuthToken;
    return safe;
  }

  @Post('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async setConfig(@Body() body: any) {
    await this.repo.upsertSettings(body);
    return { ok: true };
  }
}
