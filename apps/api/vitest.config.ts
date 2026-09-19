import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Route tests share one SQLite file; running files in parallel would let one
    // test's seed data race another's assertions.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/modules/**/*.service.ts', 'src/lib/**/*.ts'],
      exclude: ['src/generated/**'],
    },
  },
});
