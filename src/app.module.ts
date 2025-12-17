import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { QueueModule } from './queue/queue.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { RealtimeModule } from './realtime/realtime.module';
import { NotificationModule } from './notification/notification.module';
import { EncryptionModule } from './encryption/encryption.module';
import { User } from './users/entities/user.entity';
import { Category } from './categories/entities/category.entity';
import { AgentCategory } from './categories/entities/agent-category.entity';
import { Ticket } from './queue/entities/ticket.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mssql',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT', '1433'), 10),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [User, Category, AgentCategory, Ticket],
        synchronize: false, // Disabled - use DBsetup/setup-database.ts for schema changes
        logging: configService.get('NODE_ENV') === 'development',
        options: {
          encrypt: configService.get('DB_ENCRYPT', 'false') === 'true',
          trustServerCertificate: configService.get('TrustServerCertificate', 'true') === 'true',
        },
      }),
      inject: [ConfigService],
    }),
    EncryptionModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    QueueModule,
    AnalyticsModule,
    RealtimeModule,
    NotificationModule,
  ],
})
export class AppModule {}

