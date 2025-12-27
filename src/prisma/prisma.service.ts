import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor(configService: ConfigService) {
        const host = '160.25.62.77'
        const port = '1433';
        const user = 'Cognicoders';
        const password = 'BackendTeam@1234';
        const database = 'queuemanagement';
        const encrypt = configService.get<string>('DB_ENCRYPT', 'false') === 'true';
        const trustServerCertificate = configService.get<string>('TrustServerCertificate', 'true') === 'true';

        // Construct SQL Server URL if individual pieces are provided
        // Format: sqlserver://HOST:PORT;database=DB;user=USER;password=PASS;encrypt=true;trustServerCertificate=true;
        const url = host
            ? `sqlserver://${host}:${port};database=${database};user=${user};password=${password};encrypt=${encrypt};trustServerCertificate=${trustServerCertificate};`
            : process.env.DATABASE_URL;

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
