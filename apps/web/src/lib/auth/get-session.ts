import 'server-only';
import { cookies } from 'next/headers';
import { cache } from 'react';
import { ACCESS_COOKIE, decodeSession, type Session } from '@/lib/auth/session';

/**
 * The current session, or null. Wrapped in React's `cache` so a page, its layout and
 * three data-layer calls in the same render read the cookie once.
 *
 * This never refreshes. Refresh happens in `proxy.ts` on the way in, which is the
 * only place that can both read the old cookie and write the new one before the
 * page renders. By the time a server component runs, the token is already fresh.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE)?.value;
  if (!token) return null;

  const session = decodeSession(token);
  if (!session || session.expiresAt <= Date.now()) return null;

  return session;
});
