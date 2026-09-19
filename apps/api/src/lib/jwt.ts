import { randomUUID } from 'node:crypto';
import { SignJWT, jwtVerify, errors as joseErrors } from 'jose';
import { accessTokenClaimsSchema, type AccessTokenClaims } from '@ecom/contracts';
import { env } from '../config/env.js';
import { SessionExpiredError, UnauthenticatedError } from './errors.js';

const SECRET = new TextEncoder().encode(env.JWT_SECRET);
const ALGORITHM = 'HS256';
const ISSUER = 'ecom-api';
const AUDIENCE = 'ecom-web';

/**
 * Access tokens are short-lived and self-contained: the API verifies the signature
 * and reads the claims without a database round-trip. That is the whole point of
 * splitting access from refresh — the cheap check happens on every request, the
 * expensive one (database lookup, rotation, reuse detection) only every 15 minutes.
 *
 * `issuer` and `audience` are pinned so a token minted by some other service that
 * happens to share the signing secret is still rejected.
 */
export async function signAccessToken(claims: AccessTokenClaims): Promise<string> {
  return new SignJWT({ email: claims.email, name: claims.name })
    .setProtectedHeader({ alg: ALGORITHM })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setJti(randomUUID())
    .setExpirationTime(`${env.ACCESS_TOKEN_TTL_MINUTES}m`)
    .sign(SECRET);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims> {
  try {
    const { payload } = await jwtVerify(token, SECRET, {
      algorithms: [ALGORITHM],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return accessTokenClaimsSchema.parse({
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
    });
  } catch (error) {
    if (error instanceof joseErrors.JWTExpired) {
      throw new SessionExpiredError();
    }
    throw new UnauthenticatedError('Invalid access token');
  }
}
