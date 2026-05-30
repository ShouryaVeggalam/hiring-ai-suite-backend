import type { Request, Response } from 'express';
import { getPrisma } from '../config/prisma';
import { getRedis } from '../config/redis';
import { ok } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';

export const healthCheck = asyncHandler(async (_req: Request, res: Response) => {
  res.json(ok({ status: 'ok', timestamp: new Date().toISOString() }));
});

export const readinessCheck = asyncHandler(async (_req: Request, res: Response) => {
  const checks: Record<string, string> = { api: 'ok' };

  try {
    await getPrisma().$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }

  try {
    const pong = await getRedis().ping();
    checks.redis = pong === 'PONG' ? 'ok' : 'error';
  } catch {
    checks.redis = 'error';
  }

  const healthy = Object.values(checks).every((v) => v === 'ok');
  res.status(healthy ? 200 : 503).json(ok({ status: healthy ? 'ready' : 'degraded', checks }));
});

export const metricsCheck = asyncHandler(async (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send('# HELP hiring_ai_up API process is up\nhiring_ai_up 1\n');
});
