import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from 'crypto';

const ALG = 'aes-256-gcm';
const KEY_LEN = 32;
const IV_LEN = 12;
const TAG_LEN = 16;

function deriveKey(masterSecret: string, info = 'pmndigital-2fa'): Buffer {
  // HKDF-SHA256 → 32 byte key
  const salt = Buffer.from('pmndigital.salt.v1');
  return Buffer.from(
    hkdfSync('sha256', masterSecret, salt, Buffer.from(info), KEY_LEN),
  );
}

/** Encrypt plaintext → base64-encoded "iv.tag.ciphertext" */
export function encrypt(plaintext: string, masterSecret: string): string {
  const key = deriveKey(masterSecret);
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALG, key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString('base64'),
    tag.toString('base64'),
    ct.toString('base64'),
  ].join('.');
}

export function decrypt(payload: string, masterSecret: string): string {
  const parts = payload.split('.');
  if (parts.length !== 3) throw new Error('crypto: invalid ciphertext format');
  const [ivB64, tagB64, ctB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const ct = Buffer.from(ctB64, 'base64');
  if (iv.length !== IV_LEN) throw new Error('crypto: invalid iv length');
  if (tag.length !== TAG_LEN) throw new Error('crypto: invalid tag length');
  const key = deriveKey(masterSecret);
  const decipher = createDecipheriv(ALG, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}
