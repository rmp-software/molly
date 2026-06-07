import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify<
  Buffer | string,
  Buffer | string,
  number,
  Buffer
>(scrypt as (password: Buffer | string, salt: Buffer | string, keylen: number, callback: (err: Error | null, derivedKey: Buffer) => void) => void);

const KEYLEN = 64;

/**
 * Hashes a plaintext password using scrypt with a random salt.
 * Returns a string of the form: scrypt$<saltHex>$<hashHex>
 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(plain, salt, KEYLEN);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/**
 * Verifies a plaintext password against a stored hash.
 * Uses timingSafeEqual to prevent timing attacks.
 */
export async function verifyPassword(
  plain: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }
  const [, saltHex, hashHex] = parts;
  const salt = Buffer.from(saltHex, "hex");
  const storedHash = Buffer.from(hashHex, "hex");
  const hash = await scryptAsync(plain, salt, KEYLEN);
  return timingSafeEqual(hash, storedHash);
}
