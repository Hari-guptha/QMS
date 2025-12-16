import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';
import * as sql from 'mssql';
import { User, UserRole } from '../src/users/entities/user.entity';
import { Category } from '../src/categories/entities/category.entity';
import { AgentCategory } from '../src/categories/entities/agent-category.entity';
import { Ticket } from '../src/queue/entities/ticket.entity';
import { EncryptionService } from '../src/encryption/encryption.service';
import { ConfigService } from '@nestjs/config';
import { setEncryptionService } from '../src/encryption/transformers';

// Load environment variables
config();

const configService = new ConfigService();

// Database configuration
const dbConfig = {
  host: configService.get('DB_HOST', 'localhost'),
  port: parseInt(configService.get('DB_PORT', '1433')),
  username: configService.get('DB_USERNAME', 'sa'),
  password: configService.get('DB_PASSWORD', ''),
  database: configService.get('DB_DATABASE', 'qms_db'),
};

async function createDatabaseIfNotExists() {
  try {
    console.log('📦 Creating database if it does not exist...');
    console.log(`   Attempting to connect to MS SQL Server at ${dbConfig.host}:${dbConfig.port}...`);
    
    // Connect to MS SQL Server without specifying database (connect to master)
    const pool = await sql.connect({
      server: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.username,
      password: dbConfig.password,
      database: 'master',
      options: {
        encrypt: configService.get('DB_ENCRYPT', 'true') === 'true',
        trustServerCertificate: configService.get('DB_TRUST_CERT', 'true') === 'true',
      },
    });

    // Check if database exists
    const dbCheck = await pool.request().query(`
      SELECT name FROM sys.databases WHERE name = '${dbConfig.database}'
    `);

    if (dbCheck.recordset.length === 0) {
      // Create database if it doesn't exist
      await pool.request().query(`CREATE DATABASE [${dbConfig.database}]`);
      console.log(`✅ Database '${dbConfig.database}' created successfully`);
    } else {
      console.log(`✅ Database '${dbConfig.database}' already exists`);
    }
    
    await pool.close();
  } catch (error) {
    console.error('❌ Error creating database:');
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as any)?.code;
    
    console.error(`   Error: ${errorMessage}`);
    if (errorCode) {
      console.error(`   Code: ${errorCode}`);
    }
    
    // Provide helpful error messages
    if (errorCode === 'ECONNREFUSED' || errorMessage.includes('connect')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Make sure MS SQL Server is running');
      console.error('   2. Check that the port is correct (MS SQL default: 1433)');
      console.error('   3. Verify host, username, and password in .env file');
      console.error('   4. Ensure SQL Server allows TCP/IP connections');
    } else if (errorMessage.includes('Login failed') || errorMessage.includes('authentication')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Check username and password in .env file');
      console.error('   2. Verify SQL Server authentication is enabled (Mixed Mode)');
      console.error('   3. Ensure the user has CREATE DATABASE privileges');
    }
    
    throw error;
  }
}

async function setupDatabase() {
  try {
    console.log('\n🚀 Starting QMS Database Setup...\n');
    console.log('Configuration:');
    console.log(`  Host: ${dbConfig.host}`);
    console.log(`  Port: ${dbConfig.port}`);
    console.log(`  Database: ${dbConfig.database}`);
    console.log(`  Username: ${dbConfig.username}`);
    
    // Validate configuration
    if (dbConfig.port === 3306 || dbConfig.port === 5432) {
      console.log('\n⚠️  WARNING: Port detected might be for a different database!');
      console.log('   MS SQL Server default port is 1433.');
      console.log('   Please update your .env file with MS SQL settings:\n');
      console.log('   DB_PORT=1433');
      console.log('   DB_USERNAME=sa  (or your MS SQL username)');
      console.log('   DB_PASSWORD=your_mssql_password\n');
    }
    
    console.log('');

    // Step 1: Create database if it doesn't exist
    await createDatabaseIfNotExists();

    // Step 2: Initialize EncryptionService for transformers
    console.log('\n🔐 Initializing encryption service...');
    const encryptionService = new EncryptionService(configService);
    setEncryptionService(encryptionService);
    console.log('✅ Encryption service initialized');

    // Step 3: Initialize TypeORM DataSource
    console.log('\n📊 Connecting to database and creating tables...');
    const AppDataSource = new DataSource({
      type: 'mssql',
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      entities: [User, Category, AgentCategory, Ticket],
      synchronize: true, // This will create all tables
      logging: false,
      options: {
        encrypt: configService.get('DB_ENCRYPT', 'true') === 'true',
        trustServerCertificate: configService.get('DB_TRUST_CERT', 'true') === 'true',
      },
    });

    await AppDataSource.initialize();
    console.log('✅ Database connected');
    console.log('✅ All tables created/updated');

    // Step 4: Create admin user
    console.log('\n👤 Creating admin user...');
    const userRepository = AppDataSource.getRepository(User);

    // Check if admin user already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: 'masteradmin' },
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists. Updating password and role...');
      const hashedPassword = await bcrypt.hash('admin', 10);
      existingAdmin.password = hashedPassword;
      existingAdmin.role = UserRole.ADMIN;
      existingAdmin.isActive = true;
      existingAdmin.firstName = 'Master';
      existingAdmin.lastName = 'Admin';
      await userRepository.save(existingAdmin);
      console.log('✅ Admin user updated successfully');
    } else {
      console.log('Creating new admin user...');
      const hashedPassword = await bcrypt.hash('admin', 10);

      const adminUser = userRepository.create({
        email: 'masteradmin',
        password: hashedPassword,
        firstName: 'Master',
        lastName: 'Admin',
        role: UserRole.ADMIN,
        isActive: true,
      });

      await userRepository.save(adminUser);
      console.log('✅ Admin user created successfully');
    }

    // Display credentials
    console.log('\n' + '='.repeat(50));
    console.log('✅ Database setup completed successfully!');
    console.log('='.repeat(50));
    console.log('\n📋 Admin Credentials:');
    console.log('  Username/Email: masteradmin');
    console.log('  Password: admin');
    console.log('\n⚠️  Please change the default password after first login!');
    console.log('='.repeat(50) + '\n');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during database setup:');
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`   ${errorMessage}`);
    
    // Only show stack trace in development or if it's not a connection error
    if (process.env.NODE_ENV === 'development' && error instanceof Error && error.stack) {
      console.error('\n📋 Full error details:');
      console.error(error.stack);
    }
    
    console.error('\n💡 Make sure:');
    console.error('   1. MS SQL Server is installed and running');
    console.error('   2. .env file has correct MS SQL credentials:');
    console.error('      DB_HOST=localhost');
    console.error('      DB_PORT=1433  (MS SQL Server default)');
    console.error('      DB_USERNAME=sa  (or your MS SQL username)');
    console.error('      DB_PASSWORD=your_mssql_password');
    console.error('      DB_DATABASE=qms_db');
    console.error('      DB_ENCRYPT=true  (or false for local development)');
    console.error('      DB_TRUST_CERT=true  (for self-signed certificates)');
    
    process.exit(1);
  }
}

// Run the setup
setupDatabase();
