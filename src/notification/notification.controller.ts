import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'src', 'notification', 'notification.config.json');

@Controller('notification')
export class NotificationController {
  @Get('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getConfig() {
    if (!fs.existsSync(CONFIG_PATH)) return { method: 'sms', smtp: {} };
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw);
  }

  @Post('config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async setConfig(@Body() body: any) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(body, null, 2), 'utf-8');
    return { ok: true };
  }
}
