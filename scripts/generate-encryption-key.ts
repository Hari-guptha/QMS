import { EncryptionService } from '../src/encryption/encryption.service';

/**
 * Script to generate a secure encryption key
 * Run: npx ts-node scripts/generate-encryption-key.ts
 */
console.log('='.repeat(60));
console.log('Encryption Key Generator');
console.log('='.repeat(60));
console.log('');
console.log('Generated Encryption Key:');
console.log(EncryptionService.generateKey());
console.log('');
console.log('Add this to your .env file as:');
console.log('ENCRYPTION_KEY=<generated-key-above>');
console.log('');
console.log('⚠️  IMPORTANT: Keep this key secure and never commit it to version control!');
console.log('='.repeat(60));

