import { ExportFormat, ExportStatus, QuestionSetStatus, ScreeningStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { createStorage } from '../storage/storage.factory';
import type { InterviewQuestion } from '../types/ai.types';
import { ApiError } from '../utils/ApiError';
import { parsePagination, paginationMeta } from '../utils/pagination';
import {
  questionSetToCsv,
  questionSetToJson,
  type QuestionSetExportPayload,
} from '../exports/questionSet.exporter';
import { ExportRepository } from '../repositories/export.repository';
import { JobRepository } from '../repositories/job.repository';
import { QuestionSetRepository } from '../repositories/questionSet.repository';
import { ResumeRepository } from '../repositories/resume.repository';
import { activityService } from './activity.service';
import { exportService } from './export.service';
import { queueService } from './queue.service';
import { usageService, USAGE_METRICS } from './usage.service';

export interface GenerateQuestionsInput {
  jobId?: string;
  candidateId?: string;
  resumeId?: string;
  jobDescription?: string;
  jobTitle?: string;
  skills?: string[];
}

export class QuestionService {
  constructor(
    private readonly questionSetRepo = new QuestionSetRepository(),
    private readonly jobRepo = new JobRepository(),
    private readonly resumeRepo = new ResumeRepository(),
    private readonly exportRepo = new ExportRepository(),
    private readonly storage = createStorage(),
  ) {}

  async generate(organizationId: string, userId: string, input: GenerateQuestionsInput) {
    let jobId = input.jobId;
    let candidateId = input.candidateId;

    if (input.jobId) {
      const job = await this.jobRepo.findById(organizationId, input.jobId);
      if (!job) {
        throw ApiError.notFound('Job not found');
      }
      jobId = job.id;
    } else if (!input.jobDescription) {
      throw ApiError.badRequest('jobId or jobDescription is required');
    }

    if (input.resumeId) {
      const resume = await this.resumeRepo.findById(organizationId, input.resumeId);
      if (!resume) {
        throw ApiError.notFound('Resume not found');
      }
      if (resume.status !== ScreeningStatus.COMPLETED) {
        throw ApiError.badRequest('Resume must be parsed before generating questions');
      }
      candidateId = resume.candidateId ?? candidateId;
    }

    if (input.candidateId) {
      candidateId = input.candidateId;
    }

    const questionSet = await this.questionSetRepo.create({
      organization: { connect: { id: organizationId } },
      status: QuestionSetStatus.PENDING,
      ...(jobId ? { job: { connect: { id: jobId } } } : {}),
      ...(candidateId ? { candidate: { connect: { id: candidateId } } } : {}),
    });

    if (!jobId && input.jobDescription) {
      const adHocJob = await this.jobRepo.create({
        organization: { connect: { id: organizationId } },
        title: input.jobTitle ?? 'Ad-hoc interview',
        description: input.jobDescription,
        skills: input.skills ?? [],
      });
      await this.questionSetRepo.update(questionSet.id, {
        job: { connect: { id: adHocJob.id } },
      });
    }

    await this.questionSetRepo.updateStatus(questionSet.id, QuestionSetStatus.PROCESSING);

    await queueService.enqueueQuestionGeneration({
      questionSetId: questionSet.id,
      organizationId,
    });

    await usageService.track(organizationId, USAGE_METRICS.QUESTIONS);

    await activityService.log(organizationId, 'QUESTIONS_GENERATION_STARTED', {
      userId,
      entityType: 'QuestionSet',
      entityId: questionSet.id,
      metadata: { jobId, candidateId },
    });

    return this.questionSetRepo.findById(organizationId, questionSet.id);
  }

  async getById(organizationId: string, id: string) {
    const questionSet = await this.questionSetRepo.findById(organizationId, id);
    if (!questionSet) {
      throw ApiError.notFound('Question set not found');
    }
    return questionSet;
  }

  async list(
    organizationId: string,
    query: { page?: string | number; limit?: string | number; jobId?: string },
  ) {
    const { page, limit, skip } = parsePagination(query);
    const [items, total] = await Promise.all([
      this.questionSetRepo.findMany(organizationId, { skip, take: limit, jobId: query.jobId }),
      this.questionSetRepo.count(organizationId, query.jobId),
    ]);
    return { items, meta: paginationMeta(page, limit, total) };
  }

  async export(
    organizationId: string,
    userId: string,
    input: { questionSetId: string; format: 'json' | 'csv' },
  ) {
    await this.getById(organizationId, input.questionSetId);

    if (input.format === 'csv') {
      const record = await exportService.create(organizationId, userId, {
        format: ExportFormat.CSV,
        resourceType: 'question_set',
        filters: { questionSetId: input.questionSetId },
      });
      return {
        exportId: record.id,
        format: input.format,
        status: record.status,
        message: 'Export queued. Poll GET /export/:id for download URL.',
      };
    }

    const questionSet = await this.getById(organizationId, input.questionSetId);
    const payload: QuestionSetExportPayload = {
      id: questionSet.id,
      technical: questionSet.technical as unknown as InterviewQuestion[],
      behavioral: questionSet.behavioral as unknown as InterviewQuestion[],
      skillGap: questionSet.skillGap as unknown as InterviewQuestion[],
      followUps: questionSet.followUps as unknown as InterviewQuestion[],
      exportedAt: new Date().toISOString(),
    };

    const buffer = questionSetToJson(payload);
    const fileName = `questions-${questionSet.id}.json`;
    const storageKey = `${organizationId}/exports/questions/${fileName}`;

    const stored = await this.storage.upload({
      key: storageKey,
      body: buffer,
      contentType: 'application/json',
    });

    const exportRecord = await this.exportRepo.create({
      organization: { connect: { id: organizationId } },
      user: { connect: { id: userId } },
      format: ExportFormat.JSON,
      status: ExportStatus.COMPLETED,
      resourceType: 'question_set',
      filters: { questionSetId: questionSet.id } as unknown as Prisma.InputJsonValue,
      storageKey: stored.key,
      fileName,
      sizeBytes: buffer.length,
      completedAt: new Date(),
    });

    const downloadUrl = await this.storage.getSignedUrl(stored.key);

    await activityService.log(organizationId, 'QUESTIONS_EXPORTED', {
      userId,
      entityType: 'QuestionSet',
      entityId: questionSet.id,
      metadata: { format: input.format, exportId: exportRecord.id },
    });

    return {
      exportId: exportRecord.id,
      fileName,
      format: input.format,
      downloadUrl,
      sizeBytes: buffer.length,
    };
  }
}

export const questionService = new QuestionService();
