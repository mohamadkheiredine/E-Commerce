import { z } from 'zod';

/**
 * Every error the API returns carries a stable machine-readable `code`.
 *
 * The web app maps these codes to user-facing copy in `lib/api/handle-api-error.ts`,
 * which is why they are part of the shared contract rather than an API-side detail:
 * adding a code without teaching the frontend about it is a type error, not a
 * surprise in production.
 */
export const ERROR_CODES = [
  'VALIDATION_ERROR',
  'INVALID_CREDENTIALS',
  'EMAIL_TAKEN',
  'UNAUTHENTICATED',
  'SESSION_EXPIRED',
  'TOKEN_REUSE_DETECTED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'OUT_OF_STOCK',
  'INSUFFICIENT_STOCK',
  'VARIANT_REQUIRED',
  'CART_EMPTY',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
] as const;

export const errorCodeSchema = z.enum(ERROR_CODES);
export type ErrorCode = z.infer<typeof errorCodeSchema>;

/** Field-level validation failures, keyed by the offending field path. */
export const errorDetailsSchema = z.record(z.string(), z.array(z.string()));

export const apiErrorSchema = z.object({
  error: z.object({
    code: errorCodeSchema,
    message: z.string(),
    details: errorDetailsSchema.optional(),
  }),
  requestId: z.string(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;

/**
 * Success responses are always `{ data: T }` — never a bare array or scalar.
 * The envelope means a response can grow a sibling field (pagination, warnings)
 * without becoming a breaking change for every existing caller.
 */
export const apiSuccessSchema = <T extends z.ZodType>(data: T) => z.object({ data });
export type ApiSuccess<T> = { data: T };

/** A cuid2 identifier as produced by Prisma's `@default(cuid())`. */
export const idSchema = z.string().min(1, { error: 'Required' });

/**
 * Money is carried as an integer count of minor units (fils/cents) everywhere —
 * over the wire, in the database, and in business logic. Floating point currency
 * is a correctness bug waiting for a cart with three items in it. Formatting to a
 * human-readable string happens once, in the web app's serializer layer.
 */
export const minorUnitsSchema = z
  .number()
  .int({ error: 'Amount must be a whole number of minor units' })
  .nonnegative({ error: 'Amount cannot be negative' });

export const quantitySchema = z
  .number()
  .int({ error: 'Quantity must be a whole number' })
  .min(1, { error: 'Quantity must be at least 1' })
  .max(99, { error: 'Quantity cannot exceed 99' });

export const CURRENCY = 'AED' as const;
