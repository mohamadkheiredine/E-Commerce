import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';

const TEST_DB = 'file:./prisma/test.db';

/** Runs once before the suite: fresh test database, migrations applied. */
export default function setup(): void {
  for (const suffix of ['', '-journal']) {
    rmSync(`prisma/test.db${suffix}`, { force: true });
  }
  execSync('npx prisma migrate deploy', {
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: TEST_DB },
  });
}
