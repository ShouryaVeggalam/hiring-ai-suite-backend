import { ScreeningStatus } from '@prisma/client';
import type { Express } from 'express';
import path from 'path';
import { createStorage } from '../storage/storage.factory';
import { ApiError } from '../utils/ApiError';
import { sha256Checksum } from '../utils/checksum';
import { ResumeRepository } from '../repositories/resume.repository';
import { ResumeFileRepository } from '../repositories/resumeFile.repository';
import { activityService } from './activity.service';
import { fileValidationService } from './fileValidation.service';
import { queueService } from './queue.service';
import { usageService, USAGE_METRICS } from './usage.service';

export interface UploadResumeInput {
  organizationId: string;
  uploaderId: string;
  file: Express.Multer.File;
  candidateId?: string;
}

export class ResumeService {
  constructor(
    private readonly resumeRepo = new ResumeRepository(),
    private readonly resumeFileRepo = new ResumeFileRepository(),
    private readonly storage = createStorage(),
  ) {}

  async upload(input: UploadResumeInput) {
    fileValidationService.validateUpload(input.file);

    const scanStatus = await fileValidationService.scanForVirus(input.file.buffer);
    const checksum = sha256Checksum(input.file.buffer);

    const resume = await this.resumeRepo.create({
      organization: { connect: { id: input.organizationId } },
      status: ScreeningStatus.PENDING,
      ...(input.candidateId ? { candidate: { connect: { id: input.candidateId } } } : {}),
      ...(input.uploaderId ? { uploader: { connect: { id: input.uploaderId } } } : {}),
    });

    const safeName = path.basename(input.file.originalname).replace(/[^\w.\-]/g, '_');
    const storageKey = `${input.organizationId}/resumes/${resume.id}/${safeName}`;

    const stored = await this.storage.upload({
      key: storageKey,
      body: input.file.buffer,
      contentType: input.file.mimetype,
      metadata: { resumeId: resume.id, organizationId: input.organizationId },
    });

    await this.resumeFileRepo.create({
      resume: { connect: { id: resume.id } },
      storageKey: stored.key,
      bucket: stored.bucket,
      fileName: safeName,
      mimeType: input.file.mimetype,
      sizeBytes: input.file.size,
      checksum,
      scanStatus,
    });

    await this.resumeRepo.updateStatus(resume.id, ScreeningStatus.PROCESSING);

    await queueService.enqueueResumeProcessing({
      resumeId: resume.id,
      organizationId: input.organizationId,
    });

    await usageService.track(input.organizationId, USAGE_METRICS.UPLOADS);

    await activityService.log(input.organizationId, 'RESUME_UPLOADED', {
      userId: input.uploaderId,
      entityType: 'Resume',
      entityId: resume.id,
      metadata: { fileName: safeName, sizeBytes: input.file.size },
    });

    const withFile = await this.resumeRepo.findById(input.organizationId, resume.id);
    return withFile;
  }

  async getById(organizationId: string, resumeId: string) {
    const resume = await this.resumeRepo.findById(organizationId, resumeId);
    if (!resume) {
      throw ApiError.notFound('Resume not found');
    }
    return resume;
  }

  async getSignedDownloadUrl(organizationId: string, resumeId: string) {
    const resume = await this.getById(organizationId, resumeId);
    if (!resume.file) {
      throw ApiError.notFound('Resume file not found');
    }
    const url = await this.storage.getSignedUrl(resume.file.storageKey);
    return { url, fileName: resume.file.fileName, expiresIn: 'see storage config' };
  }
}

export const resumeService = new ResumeService();
