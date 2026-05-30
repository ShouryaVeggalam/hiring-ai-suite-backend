import { Prisma, ScreeningStatus } from '@prisma/client';
import type { Job } from 'bullmq';
import { getLogger } from '../config/logger';
import { getPrisma } from '../config/prisma';
import { createStorage } from '../storage/storage.factory';
import { buildParsedData, extractTextFromResume } from '../utils/parseResume';
import type { ResumeProcessingJobData } from '../types/queue.types';

const logger = getLogger();
const prisma = getPrisma();
const storage = createStorage();

export async function processResumeJob(job: Job<ResumeProcessingJobData>) {
  const { resumeId, organizationId } = job.data;
  logger.info({ resumeId, jobId: job.id }, 'Processing resume');

  const resume = await prisma.resume.findFirst({
    where: { id: resumeId, organizationId, deletedAt: null },
    include: { file: true },
  });

  if (!resume?.file) {
    throw new Error(`Resume or file not found: ${resumeId}`);
  }

  try {
    const buffer = await storage.download(resume.file.storageKey);
    const text = await extractTextFromResume(buffer, resume.file.mimeType);

    if (!text || text.length < 20) {
      throw new Error('Could not extract sufficient text from resume');
    }

    const parsedData = buildParsedData(text);

    await prisma.resume.update({
      where: { id: resumeId },
      data: {
        parsedText: text,
        parsedData: parsedData as Prisma.InputJsonValue,
        status: ScreeningStatus.COMPLETED,
        language: 'en',
      },
    });

    if (resume.file.scanStatus === 'pending') {
      await prisma.resumeFile.update({
        where: { resumeId },
        data: { scanStatus: 'clean' },
      });
    }

    logger.info({ resumeId }, 'Resume parsing completed');
    return { resumeId, wordCount: (parsedData.wordCount as number) ?? 0 };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Resume parsing failed';
    logger.error({ err, resumeId }, 'Resume parsing failed');

    await prisma.resume.update({
      where: { id: resumeId },
      data: { status: ScreeningStatus.FAILED },
    });

    throw err;
  }
}
