import { z } from 'zod';

export const createComparisonSchema = z.object({
  candidateIds: z.array(z.string().min(1)).min(2).max(10),
  jobId: z.string().min(1).optional(),
});

export const comparisonIdParamSchema = z.object({
  id: z.string().min(1),
});
