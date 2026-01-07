import { Module } from '@nestjs/common';
import { ApplicationSettingsService } from './application-settings.service';
import { ApplicationSettingsController } from './application-settings.controller';
import { ApplicationSettingsRepository } from './application-settings.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [ApplicationSettingsService, ApplicationSettingsRepository],
  controllers: [ApplicationSettingsController],
  exports: [ApplicationSettingsService, ApplicationSettingsRepository],
})
export class ApplicationSettingsModule {}

