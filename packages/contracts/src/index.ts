/**
 * The contract between the storefront and the API.
 *
 * Everything here is validated on both sides of the wire: the API parses incoming
 * requests with these schemas before a handler sees them, and the web app uses the
 * same objects to drive react-hook-form and to parse FormData inside server actions.
 * One definition, so the two can't drift.
 *
 * This package deliberately depends on nothing but zod — no React, no Express,
 * no Prisma. Anything heavier belongs in the app that needs it.
 */
export * from './common';
export * from './auth';
export * from './product';
export * from './cart';
export * from './wishlist';
export * from './order';
