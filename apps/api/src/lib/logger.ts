import pino from 'pino';
import { env, isProduction, isTest } from '../config/env.js';

/**
 * Structured JSON logs in production, human-readable in development.
 *
 * The redaction list matters more than it looks: pino serialises whole request
 * objects, and without this an `Authorization` header or a password field ends up
 * in plaintext in the log stream — which is exactly the sort of thing that survives
 * in log aggregation long after the session is gone.
 */
export const logger = pino({
  level: isTest ? 'silent' : env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.passwordHash',
      '*.accessToken',
      '*.refreshToken',
      '*.token',
    ],
    censor: '[redacted]',
  },
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
      },
});

export type Logger = typeof logger;
