import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApplicationSettingsRepository {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    try {
      // Check if the model exists in Prisma client
      if (!this.prisma.applicationSetting) {
        throw new Error('ApplicationSetting model not found in Prisma client. Please run: npx prisma generate');
      }
      
      const row = await this.prisma.applicationSetting.findFirst();
      if (!row) {
        // Create default settings if none exist
        return await this.prisma.applicationSetting.create({
          data: {
            appName: 'Queue Management System',
            logoUrl: null,
            showLogo: false,
          },
        });
      }
      return row;
    } catch (error: any) {
      // If table doesn't exist or model not found, return defaults
      if (error.code === 'P2021' || error.message?.includes('does not exist') || error.message?.includes('not found')) {
        console.warn('ApplicationSetting table/model not found, returning defaults');
        return {
          id: 'default',
          appName: 'Queue Management System',
          logoUrl: null,
          showLogo: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      throw error;
    }
  }

  async upsertSettings(dto: { appName?: string; logoUrl?: string | null; showLogo?: boolean }) {
    try {
      // Check if the model exists in Prisma client
      if (!this.prisma.applicationSetting) {
        throw new Error('ApplicationSetting model not found in Prisma client. Please run: npx prisma generate');
      }
      
      const existing = await this.prisma.applicationSetting.findFirst();
      const data: any = {
        appName: dto.appName || 'Queue Management System',
        logoUrl: dto.logoUrl !== undefined ? dto.logoUrl : null,
        showLogo: dto.showLogo !== undefined ? dto.showLogo : false,
      };

      if (existing) {
        return this.prisma.applicationSetting.update({ where: { id: existing.id }, data });
      }
      return this.prisma.applicationSetting.create({ data });
    } catch (error: any) {
      // If table doesn't exist, throw a more helpful error
      if (error.code === 'P2021' || error.message?.includes('does not exist') || error.message?.includes('not found')) {
        throw new Error('ApplicationSetting table does not exist. Please run: npx prisma migrate dev --name add_application_settings');
      }
      throw error;
    }
  }
}

