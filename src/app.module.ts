import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { QueueModule } from './queue/queue.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { RealtimeModule } from './realtime/realtime.module';
import { NotificationModule } from './notification/notification.module';
import { EncryptionModule } from './encryption/encryption.module';
import { PrismaModule } from './prisma/prisma.module';
import { ApplicationSettingsModule } from './application-settings/application-settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    EncryptionModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    QueueModule,
    AnalyticsModule,
    RealtimeModule,
    NotificationModule,
    ApplicationSettingsModule,
  ],
})
export class AppModule { }

