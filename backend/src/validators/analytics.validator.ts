import { z } from 'zod';

export const usagePeriodQuerySchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});
