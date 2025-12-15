import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';
import { createConnection } from 'mysql2/promise';
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
  port: parseInt(configService.get('DB_PORT', '3306')),
  username: configService.get('DB_USERNAME', 'root'),
  password: configService.get('DB_PASSWORD', ''),
  database: configService.get('DB_DATABASE', 'qms_db'),
};

async function createDatabaseIfNotExists() {
  try {
    // Validate port - MySQL default is 3306, warn if using PostgreSQL port
    if (dbConfig.port === 5432) {
      console.warn('⚠️  WARNING: Port 5432 is typically used for PostgreSQL, not MySQL!');
      console.warn('   MySQL default port is 3306. Please check your .env file.\n');
    }

    console.log('📦 Creating database if it does not exist...');
    console.log(`   Attempting to connect to MySQL at ${dbConfig.host}:${dbConfig.port}...`);
    
    // Connect to MySQL without specifying database
    const connection = await createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.username,
      password: dbConfig.password,
    });

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database '${dbConfig.database}' is ready`);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error creating database:');
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as any)?.code;
    const errorErrno = (error as any)?.errno;
    
    console.error(`   Error: ${errorMessage}`);
    if (errorCode) {
      console.error(`   Code: ${errorCode}`);
    }
    
    // Provide helpful error messages
    if (errorCode === 'ECONNREFUSED' || errorErrno === -4078) {
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Make sure MySQL server is running');
      console.error('   2. Check that the port is correct (MySQL default: 3306)');
      console.error('   3. Verify host, username, and password in .env file');
      if (dbConfig.port === 5432) {
        console.error('   4. ⚠️  Port 5432 is for PostgreSQL. For MySQL, use port 3306');
      }
    } else if (errorCode === 'ER_ACCESS_DENIED_ERROR' || errorMessage.includes('Access denied')) {
      console.error('\n💡 Troubleshooting:');
      console.error('   1. Check username and password in .env file');
      console.error('   2. Verify MySQL user has CREATE DATABASE privileges');
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
    if (dbConfig.port === 5432) {
      console.log('\n⚠️  WARNING: Port 5432 detected!');
      console.log('   This port is typically used for PostgreSQL.');
      console.log('   Your app.module.ts is configured for MySQL (default port: 3306).');
      console.log('   Please update your .env file with MySQL settings:\n');
      console.log('   DB_PORT=3306');
      console.log('   DB_USERNAME=root  (or your MySQL username)');
      console.log('   DB_PASSWORD=your_mysql_password\n');
    }
    
    if (dbConfig.username === 'postgres' || dbConfig.username === 'mysql') {
      console.log(`⚠️  Using username "${dbConfig.username}" - make sure this matches your MySQL user.\n`);
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
      type: 'mysql',
      host: dbConfig.host,
      port: dbConfig.port,
      username: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      entities: [User, Category, AgentCategory, Ticket],
      synchronize: true, // This will create all tables
      logging: false,
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
    console.error('   1. MySQL server is installed and running');
    console.error('   2. .env file has correct MySQL credentials:');
    console.error('      DB_HOST=localhost');
    console.error('      DB_PORT=3306  (MySQL default, not 5432 which is PostgreSQL)');
    console.error('      DB_USERNAME=root  (or your MySQL username)');
    console.error('      DB_PASSWORD=your_mysql_password');
    console.error('      DB_DATABASE=qms_db');
    
    process.exit(1);
  }
}

// Run the setup
setupDatabase();
