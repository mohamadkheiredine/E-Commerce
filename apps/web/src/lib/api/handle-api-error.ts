import type { ErrorCode } from '@ecom/contracts';
import { isApiClientError } from '@/lib/api/errors';

/**
 * Maps a stable API error code to the sentence a user should read.
 *
 * This is the direct analogue of a Postgres-error-code map in a Supabase-backed app:
 * one lookup table, at the edge, so the copy lives in one place and the rest of the
 * app deals in codes. Codes not listed here fall through to the API's own message,
 * which is already user-safe for operational errors.
 */
const MESSAGES: Partial<Record<ErrorCode, string>> = {
  VALIDATION_ERROR: 'Please check the form and try again.',
  INVALID_CREDENTIALS: 'That email and password combination is not right.',
  UNAUTHENTICATED: 'Please sign in to continue.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  TOKEN_REUSE_DETECTED: 'For your security you have been signed out. Please sign in again.',
  FORBIDDEN: 'You do not have permission to do that.',
  NOT_FOUND: 'We could not find what you were looking for.',
  RATE_LIMITED: 'Too many attempts. Please wait a few minutes and try again.',
  INTERNAL_ERROR: 'Something went wrong on our end. Please try again.',
};

export function handleApiError(error: unknown): string {
  if (isApiClientError(error)) {
    return MESSAGES[error.code] ?? error.message;
  }

  if (error instanceof Error && error.name === 'TimeoutError') {
    return 'The store took too long to respond. Please try again.';
  }

  console.error('Unexpected error:', error);
  return 'Something unexpected happened. Please try again.';
}
