import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 moved the connection URL out of schema.prisma and into this file, which
 * the CLI reads for `migrate` and `db seed`. The runtime client gets the same URL
 * through a driver adapter in src/lib/prisma.ts — so DATABASE_URL in .env is the
 * single source for both.
 *
 * The fallback matters: `prisma generate` runs from `postinstall`, i.e. before a
 * fresh clone has copied `.env.example` to `.env`. Prisma's own `env()` helper throws
 * on a missing variable and would fail `npm install` outright. Generating the client
 * does not need a live database, so a default (identical to .env.example) is safe here.
 * The API itself still refuses to boot without a real environment — see src/config/env.ts.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db',
  },
});
