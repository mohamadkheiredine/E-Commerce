import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client.js';
import { env, isProduction, isTest } from '../config/env.js';

/**
 * One client for the process.
 *
 * Prisma 7 talks to SQLite through a driver adapter rather than a bundled engine —
 * `better-sqlite3` here, chosen over libsql because this is a local file and not a
 * hosted Turso instance. The adapter is where the connection URL lives at runtime;
 * the CLI reads the same variable via prisma.config.ts.
 *
 * In development `tsx watch` re-imports modules on every change; without stashing the
 * instance on `globalThis` each reload would open a new handle to the database file.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const adapter = new PrismaBetterSqlite3({ url: env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: isProduction || isTest ? ['error'] : ['warn', 'error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (!isProduction) globalForPrisma.prisma = prisma;
