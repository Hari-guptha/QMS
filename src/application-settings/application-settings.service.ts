import { Injectable } from '@nestjs/common';
import { ApplicationSettingsRepository } from './application-settings.repository';

@Injectable()
export class ApplicationSettingsService {
  constructor(private repository: ApplicationSettingsRepository) {}

  async getSettings() {
    return await this.repository.getSettings();
  }

  async updateSettings(data: { appName?: string; logoUrl?: string | null; showLogo?: boolean }) {
    return await this.repository.upsertSettings(data);
  }
}

