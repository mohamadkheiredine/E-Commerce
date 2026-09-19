import { rateLimit, type Options } from 'express-rate-limit';
import { AppError } from '../lib/errors.js';
import { isTest } from '../config/env.js';

const rejected: Options['handler'] = (_req, _res, next) => {
  next(
    new AppError(
      429,
      'RATE_LIMITED',
      'Too many attempts. Please wait a few minutes and try again.',
    ),
  );
};

const shared: Partial<Options> = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: rejected,
  // The limiter is a third-party library; the test suite exercises our logic, not its counting.
  skip: () => isTest,
};

/**
 * Login is limited per (IP, email) pair, not just per IP. Per-IP alone lets an
 * attacker behind a large NAT lock everyone out; per-email alone lets a distributed
 * attacker spread attempts across addresses. Keying on both bounds each account to a
 * small budget per source without punishing unrelated users who share an address.
 */
export const loginRateLimit = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : '';
    return `${req.ip ?? 'unknown'}:${email}`;
  },
});

export const refreshRateLimit = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: 60,
});
