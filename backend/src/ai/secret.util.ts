import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';

/** Master key for encrypting integration credentials at rest. Prefer a dedicated
 *  INTEGRATIONS_SECRET; fall back to JWT_SECRET so it works before a new env var is added. */
function key(): Buffer {
  const src = process.env.INTEGRATIONS_SECRET || process.env.JWT_SECRET || 'pmn-dev-insecure-secret';
  return createHash('sha256').update(src).digest();
}

/** AES-256-GCM → base64(iv|tag|ciphertext). */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decryptSecret(blob: string): string {
  const buf = Buffer.from(blob, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

/** Mask a secret for display: keep last 4 chars. */
export function maskSecret(s: string | null | undefined): string {
  if (!s) return '';
  const t = s.trim();
  if (t.length <= 4) return '••••';
  return '••••••••' + t.slice(-4);
}
