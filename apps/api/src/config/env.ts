import 'dotenv/config';
import { z } from 'zod';

/**
 * Environment is parsed once, at import time, and the process refuses to start if
 * anything is missing or malformed.
 *
 * The alternative — `process.env.JWT_SECRET!` scattered through the codebase — turns
 * a missing variable into a confusing runtime failure somewhere deep in a request,
 * often only on the unhappy path. Failing at boot with a list of what's wrong is
 * strictly better, and it makes `.env.example` verifiably complete.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, { error: 'DATABASE_URL is required' }),

  /**
   * 32 bytes minimum. A short signing secret is a brute-forceable signing secret,
   * and the check costs nothing.
   */
  JWT_SECRET: z.string().min(32, {
    error: 'JWT_SECRET must be at least 32 characters — generate one with: openssl rand -base64 48',
  }),

  /** Short-lived by design: a leaked access token should expire before it is useful. */
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),

  /**
   * The only origin allowed to call this API. The browser never talks to it directly —
   * every request originates from the Next.js server — so this stays a single entry.
   */
  WEB_ORIGIN: z.url().default('http://localhost:3000'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  • ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  console.error(`\nInvalid environment configuration:\n${issues}\n\nSee .env.example.\n`);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
