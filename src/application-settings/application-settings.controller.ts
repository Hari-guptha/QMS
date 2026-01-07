import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApplicationSettingsService } from './application-settings.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('application-settings')
export class ApplicationSettingsController {
  constructor(private service: ApplicationSettingsService) {}

  @Get()
  @Public()
  async getSettings() {
    try {
      return await this.service.getSettings();
    } catch (error) {
      console.error('Error getting application settings:', error);
      // Return default settings if table doesn't exist yet
      return {
        appName: 'Queue Management System',
        logoUrl: null,
        showLogo: false,
      };
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateSettings(@Body() body: { appName?: string; logoUrl?: string | null; showLogo?: boolean }) {
    try {
      return await this.service.updateSettings(body);
    } catch (error) {
      console.error('Error updating application settings:', error);
      throw error;
    }
  }
}

