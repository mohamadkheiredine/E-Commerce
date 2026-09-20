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

/** OAuth 2's own field names, which are snake_case for the same reason the rest of the wire is. */
export const loginResponseSchema = z.object({
  user: userSchema,
  access_token: z.string(),
  refresh_token: z.string(),
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

/**
 * Sign-up.
 *
 * `signupPayloadSchema` is the wire contract: what the API accepts and what the web
 * data layer posts. It carries no `confirmPassword` — matching two fields is a form
 * concern, not something the API should have an opinion about.
 *
 * `signupFormSchema` extends it with the confirmation and the friendly copy. The
 * server action parses FormData with *this* schema rather than the payload one, so
 * the confirmation check still holds when JavaScript is off.
 *
 * Password rules follow NIST SP 800-63B: a length floor, a generous ceiling, and no
 * composition rules. Forced "one uppercase, one symbol" patterns push people toward
 * predictable substitutions and do not measurably raise entropy. argon2id has no
 * 72-byte input limit, so the ceiling only guards against hashing multi-kilobyte
 * strings on every attempt.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const NAME_MAX_LENGTH = 80;

export const signupPayloadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: 'Name is required' })
    .max(NAME_MAX_LENGTH, { error: `Name must be ${NAME_MAX_LENGTH} characters or fewer` }),
  email: z.email({ error: 'Invalid email address' }),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, {
      error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
    })
    .max(PASSWORD_MAX_LENGTH, {
      error: `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer`,
    }),
});
export type SignupPayload = z.infer<typeof signupPayloadSchema>;

export const signupFormSchema = signupPayloadSchema
  .extend({
    name: z
      .string()
      .trim()
      .min(1, { error: 'Enter your name' })
      .max(NAME_MAX_LENGTH, { error: `Keep your name to ${NAME_MAX_LENGTH} characters` }),
    email: z.email({ error: 'Enter a valid email address' }),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH, { error: `Use at least ${PASSWORD_MIN_LENGTH} characters` })
      .max(PASSWORD_MAX_LENGTH, { error: `Keep it under ${PASSWORD_MAX_LENGTH} characters` }),
    confirmPassword: z.string().min(1, { error: 'Repeat your password' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type SignupFormPayload = z.infer<typeof signupFormSchema>;

/**
 * Sign-up returns the created user and nothing else. No tokens are issued: the new
 * account signs in through the login endpoint like any other, so there is exactly
 * one code path that mints a session.
 */
export const signupResponseSchema = z.object({ user: userSchema });
export type SignupResponse = z.infer<typeof signupResponseSchema>;

export const refreshBodySchema = z.object({
  refresh_token: z.string().min(1, { error: 'Missing refresh token' }),
});
export type RefreshBody = z.infer<typeof refreshBodySchema>;

/** Logout is best-effort: a missing token is a no-op, not an error. */
export const logoutBodySchema = z.object({
  refresh_token: z.string().optional(),
});
export type LogoutBody = z.infer<typeof logoutBodySchema>;

/** Rotation returns a brand new pair; the presented token is retired on use. */
export const refreshResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
});
export type RefreshResponse = z.infer<typeof refreshResponseSchema>;

/** Claims carried inside the short-lived access JWT. */
export const accessTokenClaimsSchema = z.object({
  sub: idSchema,
  email: z.email(),
  name: z.string(),
});
export type AccessTokenClaims = z.infer<typeof accessTokenClaimsSchema>;
