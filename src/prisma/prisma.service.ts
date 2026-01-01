import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor(configService: ConfigService) {
        // Read DB connection values from ConfigService or environment
        const envUrl = configService.get<string>('DATABASE_URL') || process.env.DATABASE_URL;

        const host = configService.get<string>('DB_HOST') || process.env.DB_HOST;
        const port = configService.get<string>('DB_PORT') || process.env.DB_PORT || '1433';
        // Support both DB_USER/DB_NAME and DB_USERNAME/DB_DATABASE env var names
        const user =
            configService.get<string>('DB_USER') ||
            configService.get<string>('DB_USERNAME') ||
            process.env.DB_USER ||
            process.env.DB_USERNAME;
        const password = configService.get<string>('DB_PASSWORD') || process.env.DB_PASSWORD;
        const database =
            configService.get<string>('DB_NAME') ||
            configService.get<string>('DB_DATABASE') ||
            process.env.DB_NAME ||
            process.env.DB_DATABASE;
        const encrypt = configService.get<string>('DB_ENCRYPT', 'false') === 'true';
        const trustServerCertificate = configService.get<string>('TrustServerCertificate', 'true') === 'true';

        // Prefer full DATABASE_URL when provided, otherwise construct SQL Server URL from parts
        const databaseUrl = envUrl;
        const url = databaseUrl
            ? databaseUrl
            : host
            ? `sqlserver://${host}:${port};database=${database};user=${user};password=${password};encrypt=${encrypt};trustServerCertificate=${trustServerCertificate};`
            : undefined;

        super({
            datasources: {
                db: {
                    url,
                },
            },
        } as any);
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
