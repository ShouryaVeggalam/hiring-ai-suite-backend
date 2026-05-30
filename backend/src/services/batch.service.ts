import { BatchStatus, ScreeningStatus } from '@prisma/client';
import type { Express } from 'express';
import { ApiError } from '../utils/ApiError';
import { parsePagination, paginationMeta } from '../utils/pagination';
import { BatchRepository } from '../repositories/batch.repository';
import { JobRepository } from '../repositories/job.repository';
import { ScreeningRepository } from '../repositories/screening.repository';
import type { BatchScreeningFilters } from '../repositories/screening.repository';
import { activityService } from './activity.service';
import { resumeService } from './resume.service';
import { screeningService } from './screening.service';

const PARSE_POLL_MS = 500;
const PARSE_TIMEOUT_MS = 120_000;

export class BatchService {
  constructor(
    private readonly batchRepo = new BatchRepository(),
    private readonly jobRepo = new JobRepository(),
    private readonly screeningRepo = new ScreeningRepository(),
  ) {}

  async upload(
    organizationId: string,
    userId: string,
    input: { jobId: string; name?: string; files: Express.Multer.File[] },
  ) {
    if (!input.files?.length) {
      throw ApiError.badRequest('At least one resume file is required');
    }
    if (input.files.length > 25) {
      throw ApiError.badRequest('Maximum 25 files per batch upload');
    }

    const job = await this.jobRepo.findById(organizationId, input.jobId);
    if (!job) {
      throw ApiError.notFound('Job not found');
    }

    const batch = await this.batchRepo.create({
      organization: { connect: { id: organizationId } },
      job: { connect: { id: job.id } },
      name: input.name ?? `Batch ${new Date().toISOString()}`,
      status: BatchStatus.UPLOADING,
      totalCount: input.files.length,
      createdBy: { connect: { id: userId } },
    });

    const resumeIds: string[] = [];

    for (const file of input.files) {
      const resume = await resumeService.upload({
        organizationId,
        uploaderId: userId,
        file,
      });
      if (resume) {
        resumeIds.push(resume.id);
        await this.batchRepo.addResume(batch.id, resume.id);
      }
    }

    await this.batchRepo.update(batch.id, {
      status: BatchStatus.READY,
      totalCount: resumeIds.length,
    });

    await activityService.log(organizationId, 'BATCH_UPLOADED', {
      userId,
      entityType: 'Batch',
      entityId: batch.id,
      metadata: { resumeCount: resumeIds.length, jobId: job.id },
    });

    return this.batchRepo.findById(organizationId, batch.id);
  }

  async run(organizationId: string, userId: string, batchId: string) {
    const batch = await this.batchRepo.findById(organizationId, batchId);
    if (!batch) {
      throw ApiError.notFound('Batch not found');
    }
    if (batch.status === BatchStatus.PROCESSING) {
      throw ApiError.badRequest('Batch is already processing');
    }

    const resumeIds = batch.resumes.map((r) => r.resumeId);
    if (!resumeIds.length) {
      throw ApiError.badRequest('Batch has no resumes');
    }

    await this.waitForResumesParsed(organizationId, resumeIds);

    await this.batchRepo.updateStatus(batchId, BatchStatus.PROCESSING, {
      completedCount: 0,
      failedCount: 0,
    });

    for (const entry of batch.resumes) {
      await screeningService.run(organizationId, userId, {
        resumeId: entry.resumeId,
        jobId: batch.jobId,
        batchId,
      });
    }

    await activityService.log(organizationId, 'BATCH_RUN_STARTED', {
      userId,
      entityType: 'Batch',
      entityId: batchId,
      metadata: { resumeCount: resumeIds.length },
    });

    return this.batchRepo.findById(organizationId, batchId);
  }

  async getById(organizationId: string, batchId: string) {
    const batch = await this.batchRepo.findById(organizationId, batchId);
    if (!batch) {
      throw ApiError.notFound('Batch not found');
    }
    return batch;
  }

  async getResults(
    organizationId: string,
    batchId: string,
    query: BatchScreeningFilters & { page?: string | number; limit?: string | number; ranked?: string },
  ) {
    const batch = await this.getById(organizationId, batchId);
    const { page, limit, skip } = parsePagination(query);
    const filters: BatchScreeningFilters = {
      batchId,
      jobId: batch.jobId,
      status: query.status,
      minScore: query.minScore,
      verdict: query.verdict,
      search: query.search,
    };

    const useRanked = query.ranked !== 'false';

    const [items, total] = await Promise.all([
      useRanked
        ? this.screeningRepo.findManyRanked(organizationId, { ...filters, skip, take: limit })
        : this.screeningRepo.findMany(organizationId, { ...filters, skip, take: limit }),
      this.screeningRepo.count(organizationId, filters),
    ]);

    const rankings = useRanked
      ? items.map((item, index) => ({
          rank: skip + index + 1,
          screeningId: item.id,
          candidateId: item.candidateId,
          candidateName: item.candidate?.fullName,
          matchScore: item.matchScore,
          verdict: item.verdict,
        }))
      : undefined;

    return {
      batch: {
        id: batch.id,
        status: batch.status,
        totalCount: batch.totalCount,
        completedCount: batch.completedCount,
        failedCount: batch.failedCount,
      },
      items,
      rankings,
      meta: paginationMeta(page, limit, total),
    };
  }

  private async waitForResumesParsed(organizationId: string, resumeIds: string[]) {
    const deadline = Date.now() + PARSE_TIMEOUT_MS;

    while (Date.now() < deadline) {
      const resumes = await Promise.all(
        resumeIds.map((id) => resumeService.getById(organizationId, id)),
      );

      const allDone = resumes.every(
        (r) => r.status === ScreeningStatus.COMPLETED || r.status === ScreeningStatus.FAILED,
      );
      if (allDone) {
        const failed = resumes.filter((r) => r.status === ScreeningStatus.FAILED);
        if (failed.length === resumes.length) {
          throw ApiError.badRequest('All resumes failed to parse');
        }
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, PARSE_POLL_MS));
    }

    throw ApiError.badRequest('Timed out waiting for resume parsing to complete');
  }
}

export const batchService = new BatchService();
