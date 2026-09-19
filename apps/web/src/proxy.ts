import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/auth/update-session';

/**
 * Next 16 renamed `middleware` to `proxy`. Same role: runs before the route, on the
 * Node runtime.
 *
 * This is where the session gets refreshed and where unauthenticated navigation is
 * redirected. It is not where authorisation is enforced — every protected page and
 * data-layer call re-checks via `getUserOrRedirect()`, and the API verifies the
 * token on every request. Treating the proxy as the security boundary is the mistake
 * behind CVE-2025-29927.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and Next internals. Kept as a deny-list of
     * asset paths rather than an allow-list of app routes so a new page is protected
     * by default — forgetting to add a route here fails closed, not open.
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
