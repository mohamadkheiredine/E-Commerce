import { z } from 'zod';

/**
 * Server-side environment for the web app, validated once at import.
 *
 * `API_URL` is intentionally not `NEXT_PUBLIC_`: the browser must never learn where
 * the API is, because it must never call it. Every request goes through a server
 * action or a server component, which attach the access token from an httpOnly cookie.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_URL: z.url({ error: 'API_URL must be an absolute URL, e.g. http://localhost:4000/api/v1' }),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  • ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${issues}\n\nSee apps/web/.env.example.`);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
