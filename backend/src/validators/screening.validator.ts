import { ScreeningStatus } from '@prisma/client';
import { z } from 'zod';

export const runScreeningSchema = z.object({
  resumeId: z.string().min(1),
  jobId: z.string().min(1),
  batchId: z.string().min(1).optional(),
});

export const listScreeningsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  jobId: z.string().min(1).optional(),
  status: z.nativeEnum(ScreeningStatus).optional(),
  batchId: z.string().min(1).optional(),
});

export const screeningIdParamSchema = z.object({
  id: z.string().min(1),
});

export const resumeIdParamSchema = z.object({
  resumeId: z.string().min(1),
});

export const uploadResumeFieldsSchema = z.object({
  candidateId: z.string().min(1).optional(),
});
