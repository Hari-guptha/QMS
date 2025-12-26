import { EncryptionService } from '../encryption/encryption.service';

/**
 * Helper functions to encrypt/decrypt data when using Prisma
 * Since Prisma doesn't support transformers like TypeORM, we need to handle encryption manually
 */

export function encryptUserData(
  data: any,
  encryptionService: EncryptionService,
): any {
  if (!data) return data;

  const encrypted: any = { ...data };

  // Encrypt sensitive fields
  if (data.phone) {
    encrypted.phone = encryptionService.encrypt(data.phone);
  }
  if (data.firstName) {
    encrypted.firstName = encryptionService.encrypt(data.firstName);
  }
  if (data.lastName) {
    encrypted.lastName = encryptionService.encrypt(data.lastName);
  }

  return encrypted;
}

export function decryptUserData(
  user: any,
  encryptionService: EncryptionService,
): any {
  if (!user) return user;

  const decrypted: any = { ...user };

  // Decrypt sensitive fields
  if (user.phone) {
    decrypted.phone = encryptionService.decrypt(user.phone);
  }
  if (user.firstName) {
    decrypted.firstName = encryptionService.decrypt(user.firstName);
  }
  if (user.lastName) {
    decrypted.lastName = encryptionService.decrypt(user.lastName);
  }

  return decrypted;
}

export function encryptTicketData(
  data: any,
  encryptionService: EncryptionService,
): any {
  if (!data) return data;

  const encrypted: any = { ...data };

  // Encrypt sensitive fields
  if (data.customerName) {
    encrypted.customerName = encryptionService.encrypt(data.customerName);
  }
  if (data.customerPhone) {
    encrypted.customerPhone = encryptionService.encrypt(data.customerPhone);
  }
  if (data.customerEmail) {
    encrypted.customerEmail = encryptionService.encrypt(data.customerEmail);
  }
  if (data.formData) {
    encrypted.formData = encryptionService.encryptObject(data.formData);
  }

  return encrypted;
}

export function decryptTicketData(
  ticket: any,
  encryptionService: EncryptionService,
): any {
  if (!ticket) return ticket;

  const decrypted: any = { ...ticket };

  // Decrypt sensitive fields
  if (ticket.customerName) {
    decrypted.customerName = encryptionService.decrypt(ticket.customerName);
  }
  if (ticket.customerPhone) {
    decrypted.customerPhone = encryptionService.decrypt(ticket.customerPhone);
  }
  if (ticket.customerEmail) {
    decrypted.customerEmail = encryptionService.decrypt(ticket.customerEmail);
  }
  if (ticket.formData) {
    decrypted.formData = encryptionService.decryptObject(ticket.formData);
  }

  return decrypted;
}

