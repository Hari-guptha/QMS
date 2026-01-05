import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Encryption service (simplified version for script)
class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly key: Buffer;

  constructor() {
    const envKey = process.env.ENCRYPTION_KEY;
    
    if (!envKey) {
      console.warn('ENCRYPTION_KEY not set. Using default key (NOT SECURE FOR PRODUCTION).');
      this.key = crypto.scryptSync('default-key-change-in-production', 'salt', this.keyLength);
    } else {
      this.key = crypto.scryptSync(envKey, 'qms-salt', this.keyLength);
    }
  }

  encrypt(text: string): string {
    if (!text) return text;

    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      const combined = iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
      
      return Buffer.from(combined, 'utf8').toString('base64');
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }
}

async function createAdmin() {
  const prisma = new PrismaClient();
  const encryptionService = new EncryptionService();

  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        OR: [
          { username: 'masteradmin' },
          { email: 'masteradmin@qms.com' }
        ]
      }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('Username: masteradmin');
      console.log('Email:', existingAdmin.email);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin', 10);

    // Encrypt user data
    const encryptedFirstName = encryptionService.encrypt('Master');
    const encryptedLastName = encryptionService.encrypt('Admin');

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        username: 'masteradmin',
        email: 'masteradmin@qms.com',
        password: hashedPassword,
        firstName: encryptedFirstName,
        lastName: encryptedLastName,
        role: 'admin',
        isActive: true,
        employeeId: 'QMS-ADMIN-001',
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('Username: masteradmin');
    console.log('Email: masteradmin@qms.com');
    console.log('Password: admin');
    console.log('Role: ADMIN');
    console.log('⚠️  Please change the password after first login!');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin()
  .then(() => {
    console.log('Script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
