import { z } from 'zod';

export const generateQuestionsSchema = z
  .object({
    jobId: z.string().min(1).optional(),
    candidateId: z.string().min(1).optional(),
    resumeId: z.string().min(1).optional(),
    jobDescription: z.string().min(10).optional(),
    jobTitle: z.string().min(2).max(200).optional(),
    skills: z.array(z.string().min(1)).max(50).optional(),
  })
  .refine((data) => data.jobId || data.jobDescription, {
    message: 'Either jobId or jobDescription is required',
  });

export const questionIdParamSchema = z.object({
  id: z.string().min(1),
});

export const exportQuestionsSchema = z.object({
  questionSetId: z.string().min(1),
  format: z.enum(['json', 'csv']).default('json'),
});

export const listQuestionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  jobId: z.string().min(1).optional(),
});
