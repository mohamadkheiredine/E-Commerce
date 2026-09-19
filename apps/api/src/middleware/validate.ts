import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodType } from 'zod';
import { ValidationError } from '../lib/errors.js';

type Source = 'body' | 'params' | 'query';

/**
 * Parses one part of the request against a schema from `@ecom/contracts` and replaces
 * it with the parsed result, so handlers receive validated, correctly-typed data and
 * never touch the raw input.
 *
 * Validating at the edge rather than inside each service means a handler cannot
 * forget to check something: if it isn't in the schema, it doesn't reach the handler.
 */
export function validate<T>(schema: ZodType<T>, source: Source = 'body'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || '_';
        (details[key] ??= []).push(issue.message);
      }
      next(new ValidationError('Invalid request', details));
      return;
    }

    // `req.query` is a getter in Express 5 and cannot be reassigned, so parsed values
    // are attached separately and read via `validated(req, 'query')`.
    if (source === 'query') {
      (req as Request & { validatedQuery?: unknown }).validatedQuery = result.data;
    } else {
      req[source] = result.data as never;
    }

    next();
  };
}

/** Typed accessor for values placed on the request by `validate`. */
export function validated<T>(req: Request, source: Source = 'body'): T {
  if (source === 'query') {
    return (req as Request & { validatedQuery?: unknown }).validatedQuery as T;
  }
  return req[source] as T;
}
