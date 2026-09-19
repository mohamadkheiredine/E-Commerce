import type { ErrorCode } from '@ecom/contracts';

/**
 * A typed error hierarchy, so that "what went wrong" travels with the error instead
 * of being reconstructed from a string at the edge.
 *
 * The codebase this project's structure is modelled on had no error classes at all:
 * data-layer functions caught a driver error, logged it, and rethrew
 * `new Error("Error in insert.")`, which discarded everything the caller needed to
 * respond correctly. Every failure became a 500.
 *
 * Here the throw site picks the class, the error handler maps `status` and `code`
 * mechanically, and the web app maps `code` to user-facing copy. No string matching
 * anywhere in the chain.
 */
export class AppError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: Record<string, string[]>;
  /** False for genuine bugs, so the logger can distinguish expected 4xx from real faults. */
  readonly isOperational: boolean;

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    options?: { details?: Record<string, string[]>; cause?: unknown; isOperational?: boolean },
  ) {
    super(message, { cause: options?.cause });
    this.name = new.target.name;
    this.status = status;
    this.code = code;
    this.details = options?.details;
    this.isOperational = options?.isOperational ?? true;
    Error.captureStackTrace?.(this, new.target);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Invalid request', details?: Record<string, string[]>) {
    super(400, 'VALIDATION_ERROR', message, { details });
  }
}

/**
 * Deliberately identical for "no such user" and "wrong password". Distinguishing them
 * lets an attacker enumerate registered email addresses one request at a time.
 */
export class InvalidCredentialsError extends AppError {
  constructor() {
    super(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHENTICATED', message);
  }
}

export class SessionExpiredError extends AppError {
  constructor(message = 'Session expired') {
    super(401, 'SESSION_EXPIRED', message);
  }
}

/**
 * Raised when a refresh token that has already been rotated is presented again.
 * That should be impossible for an honest client, so it is treated as evidence the
 * token was stolen: the whole token family is revoked, logging out the real user too.
 */
export class TokenReuseDetectedError extends AppError {
  constructor() {
    super(401, 'TOKEN_REUSE_DETECTED', 'Session is no longer valid. Please sign in again.');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to do this') {
    super(403, 'FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(404, 'NOT_FOUND', `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflicts with the current state') {
    super(409, 'CONFLICT', message);
  }
}

export class OutOfStockError extends AppError {
  constructor(title: string) {
    super(409, 'OUT_OF_STOCK', `${title} is out of stock`);
  }
}

export class InsufficientStockError extends AppError {
  constructor(title: string, available: number) {
    super(
      409,
      'INSUFFICIENT_STOCK',
      available === 0
        ? `${title} is out of stock`
        : `Only ${available} of ${title} ${available === 1 ? 'is' : 'are'} available`,
    );
  }
}

export class VariantRequiredError extends AppError {
  constructor(title: string) {
    super(400, 'VARIANT_REQUIRED', `Choose an option for ${title} before adding it to your cart`);
  }
}

export class CartEmptyError extends AppError {
  constructor() {
    super(409, 'CART_EMPTY', 'Your cart is empty');
  }
}

export const isAppError = (error: unknown): error is AppError => error instanceof AppError;
