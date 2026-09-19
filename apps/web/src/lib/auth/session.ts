import 'server-only';
import { cookies } from 'next/headers';
import type { UserDto } from '@ecom/contracts';
import { isProduction } from '@/lib/config/env';

export const ACCESS_COOKIE = 'access_token';
export const REFRESH_COOKIE = 'refresh_token';

const ACCESS_MAX_AGE_SECONDS = 15 * 60;
const REFRESH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/**
 * Both cookies are httpOnly, so no script in the page can read them, and Secure in
 * production, so they never travel over plain HTTP.
 *
 * The refresh cookie is additionally SameSite=Strict: it is only ever consumed by
 * the proxy on same-site requests, so there is no reason for a browser to send it on
 * a navigation that started elsewhere. The access cookie stays Lax so a link to a
 * product page from outside the site still lands signed-in.
 */
export const accessCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
  maxAge: ACCESS_MAX_AGE_SECONDS,
} as const;

export const refreshCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'strict',
  path: '/',
  maxAge: REFRESH_MAX_AGE_SECONDS,
} as const;

export type Session = {
  user: UserDto;
  accessToken: string;
  /** Milliseconds since epoch. */
  expiresAt: number;
};

/**
 * Reads the claims out of an access token without verifying the signature.
 *
 * That is deliberate and safe: the web app has no signing secret and never makes a
 * trust decision from these claims. They are used for display (the name in the
 * header) and for scheduling the refresh. Every request that matters carries the
 * token to the API, which verifies it properly. A forged cookie here buys an
 * attacker a personalised greeting and a 401.
 */
export function decodeSession(accessToken: string): Session | null {
  const parts = accessToken.split('.');
  if (parts.length !== 3 || !parts[1]) return null;

  try {
    const json = Buffer.from(parts[1], 'base64url').toString('utf8');
    const payload = JSON.parse(json) as Record<string, unknown>;

    if (
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.name !== 'string' ||
      typeof payload.exp !== 'number'
    ) {
      return null;
    }

    return {
      user: { id: payload.sub, email: payload.email, name: payload.name },
      accessToken,
      expiresAt: payload.exp * 1000,
    };
  } catch {
    return null;
  }
}

/** Only callable from a Server Action or Route Handler — cookies cannot be set during render. */
export async function setSessionCookies(tokens: { accessToken: string; refreshToken: string }) {
  const store = await cookies();
  store.set(ACCESS_COOKIE, tokens.accessToken, accessCookieOptions);
  store.set(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions);
}

export async function clearSessionCookies() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

export async function getRefreshTokenCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value;
}
