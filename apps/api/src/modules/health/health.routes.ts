import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';

export const healthRouter: Router = Router();

/**
 * Reports whether the process can actually serve traffic, which means checking the
 * database rather than just returning 200 because Express is up. A health check that
 * cannot fail tells you nothing.
 */
healthRouter.get('/', async (_req, res) => {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      data: {
        status: 'ok',
        database: 'reachable',
        latencyMs: Date.now() - startedAt,
        uptimeSeconds: Math.round(process.uptime()),
      },
    });
  } catch {
    res.status(503).json({
      data: { status: 'degraded', database: 'unreachable', latencyMs: Date.now() - startedAt },
    });
  }
});
