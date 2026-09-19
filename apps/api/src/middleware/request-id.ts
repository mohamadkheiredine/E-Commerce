import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

/**
 * Every request carries an id, echoed back in the response header and included in
 * every error body. When something fails in the browser, the id in the error envelope
 * is enough to find the exact server-side log line — which beats correlating by
 * timestamp and guesswork.
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.get('x-request-id');
  req.id = incoming && incoming.length <= 200 ? incoming : randomUUID();
  res.setHeader('x-request-id', req.id);
  next();
}
