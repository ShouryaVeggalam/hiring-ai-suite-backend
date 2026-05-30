import { Role } from '@prisma/client';
import type { Request, Response } from 'express';
import { resumeService } from '../services/resume.service';
import { screeningService } from '../services/screening.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export const uploadResume = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest('Resume file is required (field name: file)');
  }

  const resume = await resumeService.upload({
    organizationId: req.user!.organizationId,
    uploaderId: req.user!.id,
    file: req.file,
    candidateId: req.body.candidateId,
  });

  res.status(201).json(ok({ resume }));
});

export const runScreening = asyncHandler(async (req: Request, res: Response) => {
  const screening = await screeningService.run(req.user!.organizationId, req.user!.id, req.body);
  res.status(202).json(ok({ screening }));
});

export const getScreening = asyncHandler(async (req: Request, res: Response) => {
  const screening = await screeningService.getById(
    req.user!.organizationId,
    String(req.params.id),
  );
  res.json(ok({ screening }));
});

export const listScreenings = asyncHandler(async (req: Request, res: Response) => {
  const result = await screeningService.list(req.user!.organizationId, req.query);
  res.json(ok(result.items, result.meta));
});

export const deleteScreening = asyncHandler(async (req: Request, res: Response) => {
  await screeningService.delete(req.user!.organizationId, String(req.params.id), req.user!.id);
  res.json(ok({ deleted: true }));
});

export const getResumeDownloadUrl = asyncHandler(async (req: Request, res: Response) => {
  const download = await resumeService.getSignedDownloadUrl(
    req.user!.organizationId,
    String(req.params.resumeId),
  );
  res.json(ok(download));
});

export const screeningWriteRoles = [Role.ADMIN, Role.RECRUITER, Role.HIRING_MANAGER] as const;
export const screeningDeleteRoles = [Role.ADMIN, Role.RECRUITER] as const;
