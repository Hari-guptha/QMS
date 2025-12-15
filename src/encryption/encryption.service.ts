import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly saltLength = 64; // 512 bits
  private readonly tagLength = 16; // 128 bits
  private readonly key: Buffer;
  private readonly logger = new Logger(EncryptionService.name);

  constructor(private configService: ConfigService) {
    // Get encryption key from environment or generate one
    const envKey = this.configService.get<string>('ENCRYPTION_KEY');
    
    if (!envKey) {
      this.logger.warn(
        'ENCRYPTION_KEY not set in environment. Using default key (NOT SECURE FOR PRODUCTION).',
      );
      // Default key for development only - MUST be changed in production
      this.key = crypto.scryptSync('default-key-change-in-production', 'salt', this.keyLength);
    } else {
      // Derive key from environment variable using scrypt
      this.key = crypto.scryptSync(envKey, 'qms-salt', this.keyLength);
    }
  }

  /**
   * Encrypt a string value
   */
  encrypt(text: string): string {
    if (!text) {
      return text;
    }

    try {
      // Generate random IV for each encryption
      const iv = crypto.randomBytes(this.ivLength);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
      
      // Encrypt the text
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag
      const tag = cipher.getAuthTag();
      
      // Combine IV + tag + encrypted data (format: iv:tag:encrypted)
      const combined = iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
      
      // Base64 encode for safe storage
      return Buffer.from(combined, 'utf8').toString('base64');
    } catch (error) {
      this.logger.error('Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt a string value
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) {
      return encryptedText;
    }

    // Check if the text looks like encrypted data (base64 encoded with specific format)
    // Encrypted data is base64 encoded and when decoded contains "iv:tag:encrypted" format
    // Plain text typically won't be valid base64 or won't have this format
    const isLikelyEncrypted = this.isEncryptedFormat(encryptedText);
    
    if (!isLikelyEncrypted) {
      // Plain text data (from before encryption was implemented)
      return encryptedText;
    }

    try {
      // Base64 decode
      const combined = Buffer.from(encryptedText, 'base64').toString('utf8');
      
      // Split IV, tag, and encrypted data (format: iv:tag:encrypted)
      const parts = combined.split(':');
      if (parts.length !== 3) {
        // Invalid format, return as-is (might be corrupted or different format)
        return encryptedText;
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const tag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(tag);
      
      // Decrypt
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      // Decryption failed - return original (might be plain text or corrupted)
      return encryptedText;
    }
  }

  /**
   * Check if a string is likely encrypted data
   * Encrypted data is base64 encoded and contains hex values separated by colons
   */
  private isEncryptedFormat(text: string): boolean {
    if (!text || text.length < 20) {
      return false; // Too short to be encrypted
    }

    try {
      // Try to decode as base64
      const decoded = Buffer.from(text, 'base64').toString('utf8');
      
      // Check if it has the format "hex:hex:hex" (iv:tag:encrypted)
      const parts = decoded.split(':');
      if (parts.length !== 3) {
        return false;
      }
      
      // Check if parts are valid hex strings
      const hexRegex = /^[0-9a-f]+$/i;
      return hexRegex.test(parts[0]) && hexRegex.test(parts[1]) && hexRegex.test(parts[2]);
    } catch {
      // Not valid base64, likely plain text
      return false;
    }
  }

  /**
   * Encrypt an object (for JSON fields)
   */
  encryptObject(obj: any): string {
    if (!obj) {
      return null;
    }
    
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString);
  }

  /**
   * Decrypt an object (for JSON fields)
   */
  decryptObject(encryptedText: string): any {
    if (!encryptedText) {
      return null;
    }
    
    try {
      const decrypted = this.decrypt(encryptedText);
      return JSON.parse(decrypted);
    } catch (error) {
      this.logger.error('Object decryption failed:', error);
      // Try to return as plain JSON if decryption fails
      try {
        return JSON.parse(encryptedText);
      } catch {
        return null;
      }
    }
  }

  /**
   * Generate a secure encryption key (for setup)
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

