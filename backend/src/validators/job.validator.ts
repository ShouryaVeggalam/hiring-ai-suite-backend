import { JobStatus } from '@prisma/client';
import { z } from 'zod';

export const createJobSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().min(10),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  location: z.string().max(200).optional(),
  employmentType: z.string().max(80).optional(),
  seniority: z.string().max(80).optional(),
  skills: z.array(z.string().min(1)).max(50).optional(),
  teamId: z.string().min(1).optional(),
});

export const listJobsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  status: z.nativeEnum(JobStatus).optional(),
});

export const jobIdParamSchema = z.object({
  id: z.string().min(1),
});
