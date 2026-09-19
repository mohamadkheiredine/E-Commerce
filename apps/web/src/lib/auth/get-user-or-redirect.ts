import 'server-only';
import { redirect } from 'next/navigation';
import { createApiClient, type ApiClient } from '@/lib/api/client';
import { getSession } from '@/lib/auth/get-session';
import type { UserDto } from '@ecom/contracts';

/**
 * The guard every protected page and data-layer function calls first.
 *
 * It returns the user *and* an HTTP client already bound to that user's token. That
 * pairing is the convention this codebase is modelled on — there, the guard returned
 * `{ user, supabase }`. Because the client only exists in the return value, a
 * data-layer function cannot make an authenticated call without having passed the
 * guard. There is no "forgot to check auth" path.
 *
 * The proxy has usually redirected unauthenticated requests before this runs, but
 * the proxy is a UX convenience, not the boundary. This is the boundary on the web
 * side; the API's token verification is the boundary that actually matters.
 */
export async function getUserOrRedirect({
  redirectTo = '/login',
}: { redirectTo?: string } = {}): Promise<{ user: UserDto; api: ApiClient }> {
  const session = await getSession();
  if (!session) redirect(redirectTo);

  return {
    user: session.user,
    api: createApiClient(session.accessToken),
  };
}
