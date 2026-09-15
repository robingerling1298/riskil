import crypto from 'crypto';

// WICHTIG: Lege diesen Key in deiner .env / Vercel Environment Variables an!
// Er muss exakt 32 Byte (256 Bit) lang sein (z.B. ein 64-stelliger Hex-String).
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ''; 
const IV_LENGTH = 16; // Initialization Vector für AES

export function encryptApiKey(text: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
    throw new Error('ENCRYPTION_KEY ist nicht konfiguriert oder zu kurz (min. 32 Zeichen).');
  }
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // IV und Ciphertext zusammenfügen (getrennt durch Doppelpunkt)
  return `${iv.toString('hex')}:${encrypted}`;
}

export function decryptApiKey(text: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
    throw new Error('ENCRYPTION_KEY ist nicht konfiguriert oder zu kurz.');
  }
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}