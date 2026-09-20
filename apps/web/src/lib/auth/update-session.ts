import { NextResponse, type NextRequest } from 'next/server';
import { refreshResponseSchema } from '@ecom/contracts';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  decodeSession,
  refreshCookieOptions,
} from '@/lib/auth/session';
import { deserializeTokenPair, serializeRefreshBody } from '@/serializers/auth';

/** Paths reachable without a session. Everything else is gated. */
const PUBLIC_PATHS = ['/login', '/signup'];

/** Public paths that make no sense once signed in; a session there goes to the catalogue. */
const GUEST_ONLY_PATHS = ['/login', '/signup'];

/**
 * Refresh when this much of the access token's life is left. At a 15-minute TTL,
 * refreshing under 5 minutes means every server component sees a token with at
 * least 5 minutes on it — enough that a slow render never hits a 401 mid-way.
 */
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;

const isPublic = (pathname: string) =>
  PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

async function exchangeRefreshToken(refreshToken: string) {
  // The proxy cannot import the server-only API client, so this is a direct fetch.
  const response = await fetch(`${process.env.API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(serializeRefreshBody(refreshToken)),
    signal: AbortSignal.timeout(5_000),
    cache: 'no-store',
  }).catch(() => null);

  if (!response?.ok) return null;

  const body = (await response.json().catch(() => null)) as { data?: unknown } | null;
  const parsed = refreshResponseSchema.safeParse(body?.data);
  return parsed.success ? deserializeTokenPair(parsed.data) : null;
}

/**
 * Runs on every matched request, before the page. Three jobs:
 *
 * 1. If the access token is missing or nearly expired and a refresh token exists,
 *    exchange it — and write the new cookies onto *both* the request (so this render
 *    sees them) and the response (so the browser keeps them).
 * 2. Send unauthenticated requests for protected paths to /login, remembering where
 *    they were going.
 * 3. Send already-authenticated visitors to /login on to the catalogue.
 *
 * The request-and-response cookie dance is the pattern from the codebase this is
 * modelled on. It is what makes refresh invisible to server components.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  let session = accessToken ? decodeSession(accessToken) : null;
  if (session && session.expiresAt <= Date.now()) session = null;

  let response = NextResponse.next({ request });

  const nearExpiry = session !== null && session.expiresAt - Date.now() < REFRESH_THRESHOLD_MS;
  const shouldRefresh = (session === null || nearExpiry) && refreshToken !== undefined;

  if (shouldRefresh) {
    const tokens = await exchangeRefreshToken(refreshToken);

    if (tokens) {
      request.cookies.set(ACCESS_COOKIE, tokens.accessToken);
      request.cookies.set(REFRESH_COOKIE, tokens.refreshToken);
      response = NextResponse.next({ request });
      response.cookies.set(ACCESS_COOKIE, tokens.accessToken, accessCookieOptions);
      response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions);
      session = decodeSession(tokens.accessToken);
    } else {
      // The refresh token is dead (expired, revoked, reused). Clear both so the next
      // request does not try again, and treat the visitor as signed out.
      response.cookies.delete(ACCESS_COOKIE);
      response.cookies.delete(REFRESH_COOKIE);
      session = null;
    }
  }

  if (isPublic(pathname)) {
    if (session && GUEST_ONLY_PATHS.includes(pathname)) {
      return NextResponse.redirect(new URL('/products', request.url));
    }
    return response;
  }

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${search}`);
    const redirectResponse = NextResponse.redirect(loginUrl);
    redirectResponse.cookies.delete(ACCESS_COOKIE);
    redirectResponse.cookies.delete(REFRESH_COOKIE);
    return redirectResponse;
  }

  return response;
}
