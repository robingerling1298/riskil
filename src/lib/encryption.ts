import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '';
const IV_LENGTH = 12; // 12 Bytes sind der empfohlene Standard für AES-GCM

// Key einmalig ableiten (32 Byte / 256 Bit)
function getKey(): Buffer {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
    throw new Error('ENCRYPTION_KEY ist nicht konfiguriert oder zu kurz (min. 32 Zeichen).');
  }
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

/**
 * Universelle Verschlüsselung (für API-Keys, Telefonnummern oder Notizen)
 * Format: iv:authTag:ciphertext (alle hex)
 */
export function encryptData(text: string): string {
  if (!text) return '';

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Entschlüsselt Daten mit Prüfung des Auth-Tags
 */
export function decryptData(encryptedPayload: string): string {
  if (!encryptedPayload) return '';

  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Ungültiges Ciphertext-Format. Erwartet wird iv:tag:content.');
  }

  const [ivHex, tagHex, encryptedText] = parts;
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Aliase beibehalten, damit dein bestehender Code (z.B. bei API-Keys) nicht bricht
export const encryptApiKey = encryptData;
export const decryptApiKey = decryptData;