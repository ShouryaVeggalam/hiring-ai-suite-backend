import { ComparisonStatus } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { CandidateRepository } from '../repositories/candidate.repository';
import { ComparisonRepository } from '../repositories/comparison.repository';
import { JobRepository } from '../repositories/job.repository';
import { activityService } from './activity.service';
import { queueService } from './queue.service';
import { usageService, USAGE_METRICS } from './usage.service';

export interface CreateComparisonInput {
  candidateIds: string[];
  jobId?: string;
}

export class ComparisonService {
  constructor(
    private readonly comparisonRepo = new ComparisonRepository(),
    private readonly candidateRepo = new CandidateRepository(),
    private readonly jobRepo = new JobRepository(),
  ) {}

  async create(organizationId: string, userId: string, input: CreateComparisonInput) {
    const uniqueIds = [...new Set(input.candidateIds)];
    if (uniqueIds.length < 2) {
      throw ApiError.badRequest('At least two candidates are required for comparison');
    }
    if (uniqueIds.length > 10) {
      throw ApiError.badRequest('Maximum 10 candidates per comparison');
    }

    const candidates = await this.candidateRepo.findByIds(organizationId, uniqueIds);
    if (candidates.length !== uniqueIds.length) {
      throw ApiError.badRequest('One or more candidates were not found');
    }

    if (input.jobId) {
      const job = await this.jobRepo.findById(organizationId, input.jobId);
      if (!job) {
        throw ApiError.notFound('Job not found');
      }
    }

    const comparison = await this.comparisonRepo.create({
      organization: { connect: { id: organizationId } },
      status: ComparisonStatus.PENDING,
      ...(input.jobId ? { job: { connect: { id: input.jobId } } } : {}),
    });

    await this.comparisonRepo.linkCandidates(comparison.id, uniqueIds);
    await this.comparisonRepo.updateStatus(comparison.id, ComparisonStatus.PROCESSING);

    await queueService.enqueueComparison({
      comparisonId: comparison.id,
      organizationId,
    });

    await usageService.track(organizationId, USAGE_METRICS.COMPARISONS);

    await activityService.log(organizationId, 'COMPARISON_STARTED', {
      userId,
      entityType: 'Comparison',
      entityId: comparison.id,
      metadata: { candidateIds: uniqueIds, jobId: input.jobId },
    });

    return this.comparisonRepo.findById(organizationId, comparison.id);
  }

  async getById(organizationId: string, id: string) {
    const comparison = await this.comparisonRepo.findById(organizationId, id);
    if (!comparison) {
      throw ApiError.notFound('Comparison not found');
    }
    return comparison;
  }
}

export const comparisonService = new ComparisonService();
