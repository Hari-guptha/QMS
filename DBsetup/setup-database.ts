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
/*                     FIX MSSQL CONSTRAINTS (Migration)                       */
/* -------------------------------------------------------------------------- */

async function fixMssqlConstraints(): Promise<void> {
  console.log('🔧 Checking/fixing MSSQL constraints...');

  const config: sql.config = {
    server: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    options: {
      encrypt: (process.env.DB_ENCRYPT ?? 'false') === 'true',
      trustServerCertificate: (process.env.TrustServerCertificate ?? 'true') === 'true',
      enableArithAbort: true,
    },
  } as sql.config;

  const pool = new sql.ConnectionPool(config);
  await pool.connect();

  try {
    // Drop unique constraint on microsoftId if exists (MSSQL doesn't allow multiple NULLs)
    const constraintQuery = `
      SELECT name 
      FROM sys.key_constraints 
      WHERE parent_object_id = OBJECT_ID('users') 
        AND type = 'UQ' 
        AND name LIKE '%microsoftId%'
    `;
    const constraints = await pool.request().query(constraintQuery);
    
    for (const row of constraints.recordset) {
      console.log(`  Dropping old constraint: ${row.name}`);
      await pool.request().query(`ALTER TABLE [users] DROP CONSTRAINT [${row.name}]`);
    }

    // Also check for auto-generated constraint names
    const allConstraints = await pool.request().query(`
      SELECT kc.name as constraint_name, c.name as column_name
      FROM sys.key_constraints kc
      JOIN sys.index_columns ic ON kc.parent_object_id = ic.object_id AND kc.unique_index_id = ic.index_id
      JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      WHERE kc.parent_object_id = OBJECT_ID('users') 
        AND kc.type = 'UQ'
        AND c.name = 'microsoftId'
    `);

    for (const row of allConstraints.recordset) {
      console.log(`  Dropping constraint on microsoftId: ${row.constraint_name}`);
      await pool.request().query(`ALTER TABLE [users] DROP CONSTRAINT [${row.constraint_name}]`);
    }

    console.log('✅ Constraints checked/fixed');
  } catch (error: any) {
    // Ignore errors if table doesn't exist yet
    if (!error.message?.includes('Invalid object name')) {
      console.log('  ⚠️  Constraint check skipped (table may not exist yet)');
    }
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

    /* --------------------- STEP 2: FIX CONSTRAINTS ------------------------- */
    await fixMssqlConstraints();

    /* --------------------- STEP 3: ENCRYPTION ------------------------------ */
    console.log('🔐 Initializing encryption service...');
    const encryptionService = new EncryptionService(configService);
    setEncryptionService(encryptionService);

    /* --------------------- STEP 4: TYPEORM -------------------------------- */
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

    /* --------------------- STEP 5: ADMIN USER ------------------------------ */
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
