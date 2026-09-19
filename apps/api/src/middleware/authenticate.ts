import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../lib/jwt.js';
import { UnauthenticatedError } from '../lib/errors.js';

export type AuthenticatedUser = { id: string; email: string; name: string };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Verifies the bearer token and attaches the caller to the request. Runs on every
 * protected route, so it does no I/O — a signature check and nothing else.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    throw new UnauthenticatedError();
  }

  const claims = await verifyAccessToken(header.slice('Bearer '.length));
  req.user = { id: claims.sub, email: claims.email, name: claims.name };
  next();
}

/** Narrowing helper for handlers behind `authenticate`, so they never touch `req.user?`. */
export function requireUser(req: Request): AuthenticatedUser {
  if (!req.user) throw new UnauthenticatedError();
  return req.user;
}
