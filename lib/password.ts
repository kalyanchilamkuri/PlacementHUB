import 'server-only';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

/**
 * scrypt from Node's standard library — deliberately no bcrypt dependency, which
 * would mean a native build. Stored as scrypt:<salt>:<key> so the scheme is
 * visible in the column and can be migrated later.
 */
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const key = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt:${salt}:${key.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hex] = stored.split(':');
  if (scheme !== 'scrypt' || !salt || !hex) return false;

  const expected = Buffer.from(hex, 'hex');
  const actual = await scryptAsync(password, salt, KEY_LENGTH);
  // Constant time: a length check first, because timingSafeEqual throws on a mismatch.
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// The rule itself lives in lib/password-rules.ts so the forms can state it
// without pulling this server-only module into the client bundle.
