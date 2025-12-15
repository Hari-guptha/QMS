import { ValueTransformer } from 'typeorm';
import { EncryptionService } from './encryption.service';

// Create a singleton instance for transformers
// Note: This is a workaround since transformers can't access DI
// In production, you should use a different approach or pass the service
let encryptionServiceInstance: EncryptionService | null = null;

export function setEncryptionService(service: EncryptionService) {
  encryptionServiceInstance = service;
}

export function getEncryptionService(): EncryptionService {
  if (!encryptionServiceInstance) {
    throw new Error('EncryptionService not initialized. Call setEncryptionService first.');
  }
  return encryptionServiceInstance;
}

/**
 * Transformer for encrypting/decrypting string fields
 */
export const encryptTransformer: ValueTransformer = {
  to(value: string): string {
    if (!value) return value;
    try {
      const service = getEncryptionService();
      return service.encrypt(value);
    } catch (error) {
      console.error('Encryption transformer error:', error);
      return value; // Return original if encryption fails
    }
  },
  from(value: string): string {
    if (!value) return value;
    try {
      const service = getEncryptionService();
      return service.decrypt(value);
    } catch (error) {
      console.error('Decryption transformer error:', error);
      return value; // Return original if decryption fails (for migration)
    }
  },
};

/**
 * Transformer for encrypting/decrypting JSON/object fields
 */
export const encryptObjectTransformer: ValueTransformer = {
  to(value: any): string {
    if (!value) return null;
    try {
      const service = getEncryptionService();
      return service.encryptObject(value);
    } catch (error) {
      console.error('Object encryption transformer error:', error);
      return JSON.stringify(value); // Fallback to plain JSON
    }
  },
  from(value: string): any {
    if (!value) return null;
    try {
      const service = getEncryptionService();
      return service.decryptObject(value);
    } catch (error) {
      console.error('Object decryption transformer error:', error);
      // Try to parse as plain JSON
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
  },
};

