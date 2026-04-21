import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const ALGORITHM = 'aes-256-cbc';

/**
 * Encrypt text using AES-256-CBC.
 *
 * @param {string} secret - A 32-byte secret key.
 * @param {string} text - The plaintext to encrypt.
 * @returns {{ iv: string, encryptedData: string }}
 */
function encrypt(secret, text) {
  if (!secret || secret.length !== 32) {
    throw new Error('The secret must be a 32 byte key.');
  }
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, Buffer.from(secret), iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
}

/**
 * Decrypt AES-256-CBC encrypted text.
 *
 * @param {string} secret - A 32-byte secret key.
 * @param {string} iv - The initialization vector returned by encrypt (hex string).
 * @param {string} encrypted - The encrypted data returned by encrypt (hex string).
 * @returns {string}
 */
function decrypt(secret, iv, encrypted) {
  if (!secret || secret.length !== 32) {
    throw new Error('The secret must be a 32 byte key.');
  }
  const decipher = createDecipheriv(
    ALGORITHM,
    Buffer.from(secret),
    Buffer.from(iv, 'hex')
  );
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString();
}

export { encrypt, decrypt };
