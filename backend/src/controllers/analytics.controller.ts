import { Role } from '@prisma/client';
import type { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/ApiResponse';

export const getOverview = asyncHandler(async (req: Request, res: Response) => {
  const data = await analyticsService.getOverview(req.user!.organizationId);
  res.json(ok(data));
});

export const getUsage = asyncHandler(async (req: Request, res: Response) => {
  const data = await analyticsService.getUsage(
    req.user!.organizationId,
    req.query.period as string | undefined,
  );
  res.json(ok(data));
});

export const getJobAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const data = await analyticsService.getJobAnalytics(req.user!.organizationId);
  res.json(ok({ jobs: data }));
});

export const analyticsRoles = [
  Role.ADMIN,
  Role.RECRUITER,
  Role.HIRING_MANAGER,
  Role.VIEWER,
] as const;
