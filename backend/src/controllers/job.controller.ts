import { Role } from '@prisma/client';
import type { Request, Response } from 'express';
import { jobService } from '../services/job.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/ApiResponse';

export const createJob = asyncHandler(async (req: Request, res: Response) => {
  const job = await jobService.create(req.user!.organizationId, req.body);
  res.status(201).json(ok({ job }));
});

export const getJob = asyncHandler(async (req: Request, res: Response) => {
  const job = await jobService.getById(req.user!.organizationId, String(req.params.id));
  res.json(ok({ job }));
});

export const listJobs = asyncHandler(async (req: Request, res: Response) => {
  const result = await jobService.list(req.user!.organizationId, req.query);
  res.json(ok(result.items, result.meta));
});

export const jobWriteRoles = [Role.ADMIN, Role.RECRUITER, Role.HIRING_MANAGER] as const;
