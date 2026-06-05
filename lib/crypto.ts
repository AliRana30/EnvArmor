import crypto from 'crypto';

/**
 * AES-256-GCM encryption and decryption utilities for the secret vault
 */

const ALGORITHM = 'aes-256-gcm';
const AUTH_TAG_LENGTH = 16;
const IV_LENGTH = 12; // 96 bits for GCM

/**
 * Derives a key from the master encryption key using PBKDF2
 */
function deriveKey(masterKey: string, salt: string): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');
}

/**
 * Encrypts a secret value using AES-256-GCM
 * Returns: { encrypted: hex, iv: hex, authTag: hex } as JSON string
 */
export function encryptSecret(value: string, masterKey: string): {
  encrypted: string;
  iv: string;
  authTag: string;
} {
  // Generate random IV and salt
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(16);

  // Derive encryption key
  const key = deriveKey(masterKey, salt.toString('hex'));

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt the value
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Get auth tag
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };
}

/**
 * Decrypts a secret value using AES-256-GCM
 * Input: { encrypted: hex, iv: hex, authTag: hex } as JSON string
 */
export function decryptSecret(
  encryptedData: { encrypted: string; iv: string; authTag: string; salt?: string },
  masterKey: string
): string {
  // Use stored salt or regenerate (this example assumes stable salt storage)
  const salt = encryptedData.salt || crypto.randomBytes(16).toString('hex');
  const key = deriveKey(masterKey, salt);

  const iv = Buffer.from(encryptedData.iv, 'hex');
  const encrypted = Buffer.from(encryptedData.encrypted, 'hex');
  const authTag = Buffer.from(encryptedData.authTag, 'hex');

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Masks a secret for display (shows first 4 chars + asterisks)
 */
export function maskSecret(value: string): string {
  if (value.length <= 4) {
    return '••••';
  }
  return value.substring(0, 4) + '•'.repeat(Math.min(value.length - 4, 20));
}

/**
 * Type-safe wrapper for storing encrypted secret in database
 */
export type EncryptedSecret = {
  encrypted: string;
  iv: string;
  authTag: string;
  salt: string;
};

export function createEncryptedSecret(value: string, masterKey: string): EncryptedSecret {
  const salt = crypto.randomBytes(16).toString('hex');
  const { encrypted, iv, authTag } = encryptSecret(value, masterKey);
  return { encrypted, iv, authTag, salt };
}

export function decryptSecretWithSalt(data: EncryptedSecret, masterKey: string): string {
  return decryptSecret(
    {
      encrypted: data.encrypted,
      iv: data.iv,
      authTag: data.authTag,
      salt: data.salt,
    },
    masterKey
  );
}

/**
 * Test the encryption/decryption roundtrip
 */
export function testEncryption(): void {
  const testKey = process.env.MASTER_ENCRYPTION_KEY || 'test-key-12345';
  const testValue = 'XXXXXXXX';
  if (!testValue) {
    throw new Error('testValue not set');
  }

  const encrypted = createEncryptedSecret(testValue, testKey);
  const decrypted = decryptSecretWithSalt(encrypted, testKey);

  if (decrypted !== testValue) {
    throw new Error('Encryption test failed: decrypted value does not match original');
  }

  console.log('✓ Encryption test passed');
}
