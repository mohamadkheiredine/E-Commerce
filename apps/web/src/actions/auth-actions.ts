'use server';

import { redirect } from 'next/navigation';
import { loginPayloadSchema } from '@ecom/contracts';
import { login, logout } from '@/data-layer/auth/server';
import { handleApiError } from '@/lib/api/handle-api-error';
import { clearSessionCookies, getRefreshTokenCookie, setSessionCookies } from '@/lib/auth/session';
import type { FormState } from '@/models/form-state';

/**
 * Only same-origin relative paths are honoured as a post-login destination. Anything
 * else — an absolute URL, a protocol-relative `//evil.example` — is an open redirect
 * and falls back to the catalogue.
 */
function safeNextPath(value: unknown): string {
  if (typeof value !== 'string') return '/products';
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\'))
    return '/products';
  if (value.startsWith('/login')) return '/products';
  return value;
}

export async function loginAction(_: FormState, data: FormData): Promise<FormState> {
  const formData = Object.fromEntries(data);
  const next = safeNextPath(formData.next);

  try {
    const parsed = loginPayloadSchema.safeParse(formData);

    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const key of Object.keys(formData)) {
        if (key === 'password') continue; // never echo a password back into the page
        fields[key] = JSON.stringify(formData[key]);
      }
      return {
        message: 'Invalid form data',
        fields,
        issues: parsed.error.issues.map((issue) => issue.message),
      };
    }

    const session = await login(parsed.data);
    await setSessionCookies(session);
  } catch (error) {
    console.error('Error signing in:', error);
    return { success: false, message: 'Could not sign you in.', issues: [handleApiError(error)] };
  }

  // Outside the try/catch: redirect() works by throwing, and must not be caught above.
  redirect(next);
}

export async function logoutAction(): Promise<void> {
  const refreshToken = await getRefreshTokenCookie();
  await logout(refreshToken);
  await clearSessionCookies();
  redirect('/login');
}
