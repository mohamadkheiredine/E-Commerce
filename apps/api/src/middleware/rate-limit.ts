import { ipKeyGenerator, rateLimit, type Options } from 'express-rate-limit';
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
 *
 * `ipKeyGenerator` rather than the raw `req.ip`: it buckets IPv6 by /56 subnet, since
 * one IPv6 user can otherwise rotate through billions of addresses in a single prefix.
 */
export const loginRateLimit = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : '';
    return `${req.ip ? ipKeyGenerator(req.ip) : 'unknown'}:${email}`;
  },
});

/**
 * Sign-up is per IP only — there is no account to key on yet. The budget is small
 * because a legitimate visitor creates one account, and because this endpoint is the
 * one that confirms whether an email is registered (see `EmailTakenError`).
 */
export const signupRateLimit = rateLimit({
  ...shared,
  windowMs: 60 * 60 * 1000,
  limit: 10,
});

export const refreshRateLimit = rateLimit({
  ...shared,
  windowMs: 15 * 60 * 1000,
  limit: 60,
});
