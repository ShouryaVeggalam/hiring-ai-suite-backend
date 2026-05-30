import { UsageRepository } from '../repositories/usage.repository';

export const USAGE_METRICS = {
  UPLOADS: 'uploads',
  SCREENINGS: 'screenings',
  SCREENINGS_FAILED: 'screenings_failed',
  EXPORTS: 'exports',
  API_REQUESTS: 'api_requests',
  QUESTIONS: 'questions',
  COMPARISONS: 'comparisons',
} as const;

export class UsageService {
  constructor(private readonly usageRepo = new UsageRepository()) {}

  track(organizationId: string, metric: string, amount = 1) {
    return this.usageRepo.increment(organizationId, metric, amount);
  }

  getPeriodUsage(organizationId: string, period?: string) {
    return this.usageRepo.findByOrganization(organizationId, period);
  }
}

export const usageService = new UsageService();
