import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import type { ApiError } from '@ecom/contracts';
import { AppError, NotFoundError, isAppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { isProduction } from '../config/env.js';

/** Terminal 404 for unmatched routes, so they arrive at the error handler like anything else. */
export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new NotFoundError('Endpoint'));
};

const flattenZodError = (error: ZodError): Record<string, string[]> => {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    (details[key] ??= []).push(issue.message);
  }
  return details;
};

/**
 * The single place an error becomes an HTTP response.
 *
 * Two rules it exists to enforce:
 *
 * 1. Every error leaves as the same envelope, so the web app has exactly one shape
 *    to parse and one `code` field to map to user-facing copy.
 * 2. Unrecognised errors never leak their message to the client in production. An
 *    unexpected throw is a bug, and bug messages tend to contain query fragments,
 *    file paths and occasionally data. They are logged in full and answered with a
 *    generic 500 plus the request id.
 *
 * Express 5 forwards rejected promises here automatically, which is why no route
 * needs an async try/catch wrapper.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let appError: AppError;

  if (isAppError(err)) {
    appError = err;
  } else if (err instanceof ZodError) {
    appError = new AppError(400, 'VALIDATION_ERROR', 'Invalid request', {
      details: flattenZodError(err),
    });
  } else {
    appError = new AppError(500, 'INTERNAL_ERROR', 'Something went wrong on our end', {
      cause: err,
      isOperational: false,
    });
  }

  const logPayload = { err, requestId: String(req.id), method: req.method, path: req.originalUrl };
  if (appError.isOperational) {
    logger.warn(logPayload, appError.message);
  } else {
    logger.error(logPayload, 'Unhandled error');
  }

  const body: ApiError = {
    error: {
      code: appError.code,
      message: appError.isOperational || !isProduction ? appError.message : 'Something went wrong',
      ...(appError.details ? { details: appError.details } : {}),
    },
    requestId: String(req.id),
  };

  res.status(appError.status).json(body);
};
