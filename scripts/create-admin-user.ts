import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../src/users/entities/user.entity';
import { Category } from '../src/categories/entities/category.entity';
import { AgentCategory } from '../src/categories/entities/agent-category.entity';
import { Ticket } from '../src/queue/entities/ticket.entity';

// Load environment variables
config();

// issue 

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'qms_db',
  entities: [User, Category, AgentCategory, Ticket],
  synchronize: false,
});

async function createAdminUser() {
  try {
    console.log('Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const userRepository = AppDataSource.getRepository(User);

    // Check if admin user already exists
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin' },
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists. Updating password...');
      const hashedPassword = await bcrypt.hash('admin', 10);
      existingAdmin.password = hashedPassword;
      existingAdmin.role = UserRole.ADMIN;
      existingAdmin.isActive = true;
      await userRepository.save(existingAdmin);
      console.log('✅ Admin user password updated');
    } else {
      console.log('Creating admin user...');
      const hashedPassword = await bcrypt.hash('admin', 10);

      const adminUser = userRepository.create({
        email: 'admin',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        isActive: true,
      });

      await userRepository.save(adminUser);
      console.log('✅ Admin user created successfully!');
    }

    console.log('');
    console.log('Admin Credentials:');
    console.log('  Email/Username: admin');
    console.log('  Password: admin');
    console.log('');

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:');
    console.error(error);
    process.exit(1);
  }
}

createAdminUser();

