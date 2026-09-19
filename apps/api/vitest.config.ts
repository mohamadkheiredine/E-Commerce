import { defineConfig } from 'vitest/config';

/**
 * Tests run against their own SQLite file so a failing test can never touch
 * development data. `globalSetup` applies migrations to it once per run.
 *
 * Values here are set before any module loads, so `src/config/env.ts` sees them
 * and `dotenv` (which never overrides an existing variable) leaves them alone.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globalSetup: ['src/test/global-setup.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'file:./prisma/test.db',
      JWT_SECRET: 'test-only-secret-with-enough-length-to-pass-validation-0000',
      WEB_ORIGIN: 'http://localhost:3000',
      ACCESS_TOKEN_TTL_MINUTES: '15',
      REFRESH_TOKEN_TTL_DAYS: '7',
    },
    // Route tests share one SQLite file; running files in parallel would let one
    // test's fixtures race another's assertions.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/modules/**/*.service.ts', 'src/lib/**/*.ts', 'src/middleware/**/*.ts'],
      exclude: ['src/generated/**'],
    },
  },
});
