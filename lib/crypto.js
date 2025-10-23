// /lib/crypto.js
import crypto from 'crypto';

// ENCRYPTION_KEY = 32 octets en base64 (ex: générée via "openssl rand -base64 32")
const KEY_B64 = process.env.ENCRYPTION_KEY || '';
const KEY = Buffer.from(KEY_B64, 'base64'); // 32 bytes

export function encrypt(plaintext) {
  if (!KEY || KEY.length !== 32) throw new Error('Invalid ENCRYPTION_KEY (32 bytes base64 required)');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decrypt(b64) {
  if (!KEY || KEY.length !== 32) throw new Error('Invalid ENCRYPTION_KEY (32 bytes base64 required)');
  const buf = Buffer.from(b64, 'base64');
  const iv = buf.subarray(0,12);
  const tag = buf.subarray(12,28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString('utf8');
}
