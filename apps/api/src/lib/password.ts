import { hash, verify } from '@node-rs/argon2';

/**
 * argon2id, not bcrypt.
 *
 * bcrypt is CPU-hard but cheap to parallelise on a GPU. argon2id is additionally
 * *memory*-hard, which is what makes large-scale offline cracking expensive, and it
 * won the Password Hashing Competition for exactly that reason.
 *
 * `@node-rs/argon2` is the Rust binding and ships prebuilt binaries, so there is no
 * node-gyp/Visual-Studio-build-tools requirement on Windows.
 *
 * Parameters follow the OWASP recommendation for argon2id (19 MiB, 2 iterations,
 * 1 degree of parallelism). The library's default algorithm is argon2id; it is not
 * named here because its `Algorithm` export is an ambient const enum, which
 * `verbatimModuleSyntax` refuses to inline.
 */
const OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(plaintext: string): Promise<string> {
  return hash(plaintext, OPTIONS);
}

/**
 * Returns false rather than throwing on a malformed hash, so a corrupt row reads as
 * a failed login instead of a 500 that tells the caller the account exists.
 */
export async function verifyPassword(digest: string, plaintext: string): Promise<boolean> {
  try {
    return await verify(digest, plaintext, OPTIONS);
  } catch {
    return false;
  }
}
