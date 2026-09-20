'use server';

import { redirect } from 'next/navigation';
import { loginPayloadSchema, signupFormSchema } from '@ecom/contracts';
import { login, logout, signup } from '@/data-layer/auth/server';
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
  if (value.startsWith('/login') || value.startsWith('/signup')) return '/products';
  return value;
}

/** Re-seeds the form after a failed round-trip. Passwords are never echoed back. */
function echoFields(formData: Record<string, FormDataEntryValue>): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const key of Object.keys(formData)) {
    if (key === 'password' || key === 'confirmPassword') continue;
    fields[key] = JSON.stringify(formData[key]);
  }
  return fields;
}

/**
 * Parses with the *form* schema, not the payload schema, on purpose: the password
 * confirmation must be enforced here for the no-JavaScript path, and the API has no
 * business knowing a confirmation field exists. Only the payload fields go over the wire.
 */
export async function signupAction(_: FormState, data: FormData): Promise<FormState> {
  const formData = Object.fromEntries(data);
  const next = safeNextPath(formData.next);

  try {
    const parsed = signupFormSchema.safeParse(formData);

    if (!parsed.success) {
      return {
        message: 'Invalid form data',
        fields: echoFields(formData),
        issues: parsed.error.issues.map((issue) => issue.message),
      };
    }

    const { name, email, password } = parsed.data;
    const session = await signup({ name, email, password });
    await setSessionCookies(session);
  } catch (error) {
    console.error('Error creating account:', error);
    return {
      success: false,
      message: 'Could not create your account.',
      fields: echoFields(formData),
      issues: [handleApiError(error)],
    };
  }

  redirect(next);
}

export async function loginAction(_: FormState, data: FormData): Promise<FormState> {
  const formData = Object.fromEntries(data);
  const next = safeNextPath(formData.next);

  try {
    const parsed = loginPayloadSchema.safeParse(formData);

    if (!parsed.success) {
      return {
        message: 'Invalid form data',
        fields: echoFields(formData),
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
