import { DataSource } from 'typeorm';
import { config as dotenvConfig } from 'dotenv';
import * as bcrypt from 'bcrypt';
import sql from 'mssql';
import { ConfigService } from '@nestjs/config';

import { User, UserRole } from '../src/users/entities/user.entity';
import { Category } from '../src/categories/entities/category.entity';
import { AgentCategory } from '../src/categories/entities/agent-category.entity';
import { Ticket } from '../src/queue/entities/ticket.entity';

import { EncryptionService } from '../src/encryption/encryption.service';
import { setEncryptionService } from '../src/encryption/transformers';

/* -------------------------------------------------------------------------- */
/*                                   ENV                                      */
/* -------------------------------------------------------------------------- */

dotenvConfig();
const configService = new ConfigService();

/**
 * Read configuration from .env file only
 */
const dbConfig = {
  host: process.env.DB_HOST!,
  port: parseInt(process.env.DB_PORT!, 10),
  username: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
};

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('\nPlease ensure your .env file contains:');
  console.error('  DB_HOST=your_server_ip');
  console.error('  DB_PORT=1433');
  console.error('  DB_USER=your_username');
  console.error('  DB_PASSWORD=your_password');
  console.error('  DB_NAME=your_database_name');
  process.exit(1);
}

/* -------------------------------------------------------------------------- */
/*                     CREATE DATABASE IF NOT EXISTS                           */
/* -------------------------------------------------------------------------- */

async function createDatabaseIfNotExists(): Promise<void> {
  console.log('📦 Checking / creating database...');

  const config: sql.config = {
    server: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.username,
    password: dbConfig.password,
    database: 'master',
    options: {
      encrypt: (process.env.DB_ENCRYPT ?? 'false') === 'true',
      trustServerCertificate: (process.env.TrustServerCertificate ?? 'true') === 'true',
      enableArithAbort: true,
    },
  } as sql.config;

  const pool = new sql.ConnectionPool(config);
  await pool.connect();

  const result = await pool.request().query(
    `SELECT name FROM sys.databases WHERE name = '${dbConfig.database}'`
  );

  if (result.recordset.length === 0) {
    await pool.request().query(
      `CREATE DATABASE [${dbConfig.database}]`
    );
    console.log(`✅ Database '${dbConfig.database}' created`);
  } else {
    console.log(`✅ Database '${dbConfig.database}' already exists`);
  }

  await pool.close();
}

/* -------------------------------------------------------------------------- */
/*                                 SETUP                                      */
/* -------------------------------------------------------------------------- */

async function setupDatabase(): Promise<void> {
  try {
    console.log('\n🚀 Starting QMS Database Setup\n');

    console.log('Configuration');
    console.log(` Host: ${dbConfig.host}`);
    console.log(` Port: ${dbConfig.port}`);
    console.log(` Database: ${dbConfig.database}`);
    console.log(` User: ${dbConfig.username}\n`);

    /* --------------------- STEP 1: CREATE DB ------------------------------- */
    await createDatabaseIfNotExists();

    /* --------------------- STEP 2: ENCRYPTION ------------------------------ */
    console.log('🔐 Initializing encryption service...');
    const encryptionService = new EncryptionService(configService);
    setEncryptionService(encryptionService);

    /* --------------------- STEP 3: TYPEORM -------------------------------- */
    console.log('\n📊 Connecting to database...');

    const AppDataSource = new DataSource({
      type: 'mssql',
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      entities: [User, Category, AgentCategory, Ticket],
      synchronize: true,
      logging: false,
      options: {
        encrypt: (process.env.DB_ENCRYPT ?? 'false') === 'true',
        trustServerCertificate:
          (process.env.TrustServerCertificate ?? 'true') === 'true',
      },
    });

    await AppDataSource.initialize();

    console.log('✅ Database connected');
    console.log('✅ Tables created / updated');

    /* --------------------- STEP 4: ADMIN USER ------------------------------ */
    console.log('\n👤 Creating admin user...');

    const userRepo = AppDataSource.getRepository(User);
    const hashedPassword = await bcrypt.hash('admin', 10);

    const admin = await userRepo.findOne({
      where: { email: 'masteradmin' },
    });

    if (admin) {
      admin.password = hashedPassword;
      admin.role = UserRole.ADMIN;
      admin.isActive = true;
      admin.firstName = 'Master';
      admin.lastName = 'Admin';
      await userRepo.save(admin);
      console.log('✅ Admin user updated');
    } else {
      await userRepo.save(
        userRepo.create({
          email: 'masteradmin',
          password: hashedPassword,
          role: UserRole.ADMIN,
          isActive: true,
          firstName: 'Master',
          lastName: 'Admin',
        })
      );
      console.log('✅ Admin user created');
    }

    /* --------------------------- DONE ------------------------------------- */
    console.log('\n' + '='.repeat(55));
    console.log('✅ DATABASE SETUP COMPLETED SUCCESSFULLY');
    console.log('='.repeat(55));
    console.log(' Admin Login');
    console.log(' Username : masteradmin');
    console.log(' Password : admin');
    console.log('='.repeat(55) + '\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Setup failed');
    console.error(error);
    process.exit(1);
  }
}

/* -------------------------------------------------------------------------- */
/*                                   RUN                                      */
/* -------------------------------------------------------------------------- */

setupDatabase();
