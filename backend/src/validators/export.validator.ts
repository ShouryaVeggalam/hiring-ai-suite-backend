import { z } from 'zod';

export const createExportSchema = z.object({
  resourceType: z.enum(['screenings', 'candidates', 'question_set', 'batch']),
  filters: z
    .object({
      jobId: z.string().min(1).optional(),
      batchId: z.string().min(1).optional(),
      status: z.string().min(1).optional(),
      questionSetId: z.string().min(1).optional(),
    })
    .optional(),
});

export const exportIdParamSchema = z.object({
  id: z.string().min(1),
});
