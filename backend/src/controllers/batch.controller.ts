import { Role } from '@prisma/client';
import type { Request, Response } from 'express';
import { batchService } from '../services/batch.service';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/ApiResponse';

export const uploadBatch = asyncHandler(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;
  if (!files?.length) {
    throw ApiError.badRequest('At least one file is required (field name: files)');
  }

  const batch = await batchService.upload(req.user!.organizationId, req.user!.id, {
    jobId: req.body.jobId,
    name: req.body.name,
    files,
  });

  res.status(201).json(ok({ batch }));
});

export const runBatch = asyncHandler(async (req: Request, res: Response) => {
  const batch = await batchService.run(
    req.user!.organizationId,
    req.user!.id,
    req.body.batchId,
  );
  res.status(202).json(ok({ batch }));
});

export const getBatch = asyncHandler(async (req: Request, res: Response) => {
  const batch = await batchService.getById(req.user!.organizationId, String(req.params.id));
  res.json(ok({ batch }));
});

export const getBatchResults = asyncHandler(async (req: Request, res: Response) => {
  const batchId = req.params.id ?? req.query.batchId;
  if (!batchId) {
    throw ApiError.badRequest('batchId is required');
  }

  const result = await batchService.getResults(
    req.user!.organizationId,
    String(batchId),
    req.query,
  );
  res.json(ok(result));
});

export const batchWriteRoles = [Role.ADMIN, Role.RECRUITER, Role.HIRING_MANAGER] as const;
