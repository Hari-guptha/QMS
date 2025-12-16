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
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 1433),
        username: configService.get('DB_USERNAME', 'sa'),
        password: configService.get('DB_PASSWORD', ''),
        database: configService.get('DB_DATABASE', 'qms_db'),
        entities: [User, Category, AgentCategory, Ticket],
        synchronize: false, // Disabled to prevent enum modification conflicts. Use migrations or run: npm run update:enum
        logging: configService.get('NODE_ENV') === 'development',
        options: {
          encrypt: configService.get('DB_ENCRYPT', 'true') === 'true',
          trustServerCertificate: configService.get('DB_TRUST_CERT', 'true') === 'true',
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

