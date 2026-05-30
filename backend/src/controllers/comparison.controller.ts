import { Role } from '@prisma/client';
import type { Request, Response } from 'express';
import { comparisonService } from '../services/comparison.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/ApiResponse';

export const createComparison = asyncHandler(async (req: Request, res: Response) => {
  const comparison = await comparisonService.create(
    req.user!.organizationId,
    req.user!.id,
    req.body,
  );
  res.status(202).json(ok({ comparison }));
});

export const getComparison = asyncHandler(async (req: Request, res: Response) => {
  const comparison = await comparisonService.getById(
    req.user!.organizationId,
    String(req.params.id),
  );
  res.json(ok({ comparison }));
});

export const comparisonWriteRoles = [Role.ADMIN, Role.RECRUITER, Role.HIRING_MANAGER] as const;
