import { ScreeningStatus } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { parsePagination, paginationMeta } from '../utils/pagination';
import { JobRepository } from '../repositories/job.repository';
import { ResumeRepository } from '../repositories/resume.repository';
import { ScreeningRepository } from '../repositories/screening.repository';
import { activityService } from './activity.service';
import { queueService } from './queue.service';

export interface RunScreeningInput {
  resumeId: string;
  jobId: string;
  batchId?: string;
}

export class ScreeningService {
  constructor(
    private readonly screeningRepo = new ScreeningRepository(),
    private readonly resumeRepo = new ResumeRepository(),
    private readonly jobRepo = new JobRepository(),
  ) {}

  async run(organizationId: string, userId: string, input: RunScreeningInput) {
    const resume = await this.resumeRepo.findById(organizationId, input.resumeId);
    if (!resume) {
      throw ApiError.notFound('Resume not found');
    }
    if (resume.status !== ScreeningStatus.COMPLETED || !resume.parsedText) {
      throw ApiError.badRequest(
        'Resume is not ready for screening. Wait until parsing completes.',
      );
    }

    const job = await this.jobRepo.findById(organizationId, input.jobId);
    if (!job) {
      throw ApiError.notFound('Job not found');
    }

    const screening = await this.screeningRepo.create({
      organization: { connect: { id: organizationId } },
      job: { connect: { id: job.id } },
      resume: { connect: { id: resume.id } },
      status: ScreeningStatus.PENDING,
      batchId: input.batchId,
      ...(resume.candidateId ? { candidate: { connect: { id: resume.candidateId } } } : {}),
      createdBy: { connect: { id: userId } },
    });

    await this.screeningRepo.updateStatus(screening.id, ScreeningStatus.PROCESSING, {
      startedAt: new Date(),
    });

    await queueService.enqueueScreening({
      screeningId: screening.id,
      organizationId,
    });

    await activityService.log(organizationId, 'SCREENING_STARTED', {
      userId,
      entityType: 'Screening',
      entityId: screening.id,
      metadata: { jobId: job.id, resumeId: resume.id },
    });

    return this.screeningRepo.findById(organizationId, screening.id);
  }

  async getById(organizationId: string, id: string) {
    const screening = await this.screeningRepo.findById(organizationId, id);
    if (!screening) {
      throw ApiError.notFound('Screening not found');
    }
    return screening;
  }

  async list(
    organizationId: string,
    query: {
      page?: string | number;
      limit?: string | number;
      jobId?: string;
      status?: ScreeningStatus;
      batchId?: string;
    },
  ) {
    const { page, limit, skip } = parsePagination(query);
    const filters = {
      jobId: query.jobId,
      status: query.status,
      batchId: query.batchId,
    };

    const [items, total] = await Promise.all([
      this.screeningRepo.findMany(organizationId, { skip, take: limit, ...filters }),
      this.screeningRepo.count(organizationId, filters),
    ]);

    return { items, meta: paginationMeta(page, limit, total) };
  }

  async delete(organizationId: string, id: string, userId: string) {
    const screening = await this.getById(organizationId, id);
    const result = await this.screeningRepo.delete(organizationId, id);
    if (result.count === 0) {
      throw ApiError.notFound('Screening not found');
    }

    await activityService.log(organizationId, 'SCREENING_DELETED', {
      userId,
      entityType: 'Screening',
      entityId: screening.id,
    });
  }
}

export const screeningService = new ScreeningService();
