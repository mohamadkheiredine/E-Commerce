import { defineConfig } from 'tsup';

/**
 * The API is bundled rather than merely transpiled because `@ecom/contracts` is
 * consumed as TypeScript source (see that package's `exports`). Bundling pulls the
 * shared schemas into the output, so there is no build-ordering dance between the
 * two packages and no separate dist for contracts to keep in sync.
 *
 * Prisma's generated client stays external — it ships its own engine binaries and
 * must not be inlined.
 */
export default defineConfig({
  entry: ['src/index.ts'],
  outDir: 'dist',
  format: ['esm'],
  target: 'node22',
  platform: 'node',
  sourcemap: true,
  clean: true,
  splitting: false,
  noExternal: ['@ecom/contracts'],
  external: [
    '@prisma/client',
    '.prisma/client',
    '@prisma/adapter-better-sqlite3',
    'better-sqlite3',
  ],
});
