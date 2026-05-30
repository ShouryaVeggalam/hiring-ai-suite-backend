import { ScreeningStatus, Verdict } from '@prisma/client';
import { z } from 'zod';

export const batchUploadFieldsSchema = z.object({
  jobId: z.string().min(1),
  name: z.string().min(1).max(120).optional(),
});

export const batchRunSchema = z.object({
  batchId: z.string().min(1),
});

export const batchIdParamSchema = z.object({
  id: z.string().min(1),
});

export const batchResultsQuerySchema = z.object({
  batchId: z.string().min(1).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.nativeEnum(ScreeningStatus).optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  verdict: z.nativeEnum(Verdict).optional(),
  search: z.string().min(1).max(120).optional(),
  ranked: z.enum(['true', 'false']).optional(),
});

export const batchResultsListQuerySchema = batchResultsQuerySchema.extend({
  batchId: z.string().min(1),
});
