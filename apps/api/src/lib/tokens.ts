import { createHash, randomBytes, randomUUID } from 'node:crypto';

/**
 * Refresh tokens are opaque: 48 random bytes, no structure, no claims. The API looks
 * them up by hash. There is nothing to decode and nothing to forge.
 */
export function generateRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

/**
 * Stored hashed so a database read cannot be replayed as a session.
 *
 * SHA-256 rather than argon2 is deliberate: argon2 exists to slow down guessing of
 * low-entropy secrets like passwords. A 384-bit random token is not guessable, so the
 * slow hash would cost every refresh a hundred milliseconds for no security gain.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newTokenFamily(): string {
  return randomUUID();
}
