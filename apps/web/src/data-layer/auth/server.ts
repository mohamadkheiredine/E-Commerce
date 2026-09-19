import 'server-only';
import { loginResponseSchema, type LoginPayload, type LoginResponse } from '@ecom/contracts';
import { publicApi } from '@/lib/api/client';

/**
 * Auth is the one data-layer module that does not go through `getUserOrRedirect()`,
 * because by definition there is no user yet.
 */
export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const data = await publicApi.post<unknown>('/auth/login', payload);
  // Parse rather than cast: the API is ours, but a schema check here is what turns
  // "the API changed shape" into a clear error instead of an undefined somewhere later.
  return loginResponseSchema.parse(data);
}

export async function logout(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) return;
  // Best effort. If the API is unreachable the cookies are cleared regardless, and
  // the refresh token is useless without them.
  await publicApi.post<void>('/auth/logout', { refreshToken }).catch(() => undefined);
}
