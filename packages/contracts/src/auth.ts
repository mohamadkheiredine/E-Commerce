import { z } from 'zod';
import { idSchema } from './common';

export const userSchema = z.object({
  id: idSchema,
  email: z.email(),
  name: z.string(),
});
export type UserDto = z.infer<typeof userSchema>;

/**
 * Two schemas per operation, following the convention this project mirrors.
 *
 * `loginFormSchema` drives react-hook-form's zodResolver in the browser, so it carries
 * the friendly copy a user should see while typing.
 *
 * `loginPayloadSchema` is what the server action parses out of `FormData` and what the
 * API validates on the wire. It deliberately does NOT reuse the form schema's forgiving
 * messages: server-side failures are a fallback for the no-JavaScript path and for
 * anyone posting to the endpoint directly, so they stay terse.
 *
 * The password rule is intentionally only a presence check on login. Enforcing
 * complexity here would leak which passwords could possibly exist in the database.
 */
export const loginFormSchema = z.object({
  email: z.email({ error: 'Enter a valid email address' }),
  password: z.string().min(1, { error: 'Enter your password' }),
});
export type LoginFormPayload = z.infer<typeof loginFormSchema>;

export const loginPayloadSchema = z.object({
  email: z.email({ error: 'Invalid email or password' }),
  password: z.string().min(1, { error: 'Invalid email or password' }),
});
export type LoginPayload = z.infer<typeof loginPayloadSchema>;

export const loginResponseSchema = z.object({
  user: userSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const refreshPayloadSchema = z.object({
  refreshToken: z.string().min(1, { error: 'Missing refresh token' }),
});
export type RefreshPayload = z.infer<typeof refreshPayloadSchema>;

/** Rotation returns a brand new pair; the presented token is retired on use. */
export const refreshResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;

/** Claims carried inside the short-lived access JWT. */
export const accessTokenClaimsSchema = z.object({
  sub: idSchema,
  email: z.email(),
  name: z.string(),
});
export type AccessTokenClaims = z.infer<typeof accessTokenClaimsSchema>;
