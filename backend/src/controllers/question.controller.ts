import { Role } from '@prisma/client';
import type { Request, Response } from 'express';
import { questionService } from '../services/question.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/ApiResponse';

export const generateQuestions = asyncHandler(async (req: Request, res: Response) => {
  const questionSet = await questionService.generate(
    req.user!.organizationId,
    req.user!.id,
    req.body,
  );
  res.status(202).json(ok({ questionSet }));
});

export const getQuestionSet = asyncHandler(async (req: Request, res: Response) => {
  const questionSet = await questionService.getById(
    req.user!.organizationId,
    String(req.params.id),
  );
  res.json(ok({ questionSet }));
});

export const exportQuestions = asyncHandler(async (req: Request, res: Response) => {
  const result = await questionService.export(req.user!.organizationId, req.user!.id, req.body);
  res.status(201).json(ok(result));
});

export const questionWriteRoles = [Role.ADMIN, Role.RECRUITER, Role.HIRING_MANAGER] as const;
