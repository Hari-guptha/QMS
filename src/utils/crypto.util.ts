import * as crypto from 'crypto';

const ALGO = 'aes-256-cbc';
const IV_LENGTH = 16;

export function encrypt(text: string, secret: string): string {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.createHash('sha256').update(secret).digest();
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(encryptedText: string, secret: string): string {
  if (!encryptedText) return null;
  const [ivHex, dataHex] = encryptedText.split(':');
  if (!ivHex || !dataHex) return null;
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(dataHex, 'hex');
  const key = crypto.createHash('sha256').update(secret).digest();
  const decipher = crypto.createDecipheriv(ALGO, key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

export default { encrypt, decrypt };
