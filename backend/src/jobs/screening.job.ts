import { Prisma, ScreeningStatus } from '@prisma/client';
import type { Job } from 'bullmq';
import { getLogger } from '../config/logger';
import { getPrisma } from '../config/prisma';
import { createScreeningProvider } from '../providers/ai/provider.factory';
import { notificationService } from '../services/notification.service';
import { recordBatchScreeningOutcome } from '../services/batchProgress.service';
import { usageService, USAGE_METRICS } from '../services/usage.service';
import type { ScreeningJobData } from '../types/queue.types';

const logger = getLogger();
const prisma = getPrisma();

export async function processScreeningJob(job: Job<ScreeningJobData>) {
  const { screeningId, organizationId } = job.data;
  logger.info({ screeningId, jobId: job.id }, 'Running screening');

  const screening = await prisma.screening.findFirst({
    where: { id: screeningId, organizationId },
    include: {
      job: true,
      resume: true,
    },
  });

  if (!screening?.job || !screening.resume?.parsedText) {
    throw new Error(`Screening context incomplete: ${screeningId}`);
  }

  const provider = createScreeningProvider();

  try {
    const output = await provider.screen({
      jobDescription: screening.job.description,
      jobSkills: screening.job.skills,
      resumeText: screening.resume.parsedText,
      parsedData: screening.resume.parsedData as Record<string, unknown> | undefined,
    });

    await prisma.$transaction(async (tx) => {
      await tx.screeningResult.create({
        data: {
          screeningId: screening.id,
          matchScore: output.matchScore,
          skillMatch: output.skillMatch as unknown as Prisma.InputJsonValue,
          missingSkills: output.missingSkills,
          strengths: output.strengths,
          weaknesses: output.weaknesses,
          confidence: output.confidence,
          verdict: output.verdict,
          explanation: output.explanation,
          rawProviderOutput: output as unknown as Prisma.InputJsonValue,
          modelName: output.modelName,
          providerName: provider.name,
          tokensUsed: output.tokensUsed,
        },
      });

      await tx.screening.update({
        where: { id: screeningId },
        data: {
          status: ScreeningStatus.COMPLETED,
          matchScore: output.matchScore,
          verdict: output.verdict,
          completedAt: new Date(),
          errorMessage: null,
        },
      });
    });

    await recordBatchScreeningOutcome(screening.batchId, true);
    await usageService.track(organizationId, USAGE_METRICS.SCREENINGS);

    if (screening.createdById) {
      await notificationService.notify({
        organizationId,
        userId: screening.createdById,
        channels: ['IN_APP'],
        subject: 'Screening completed',
        body: `Screening finished with score ${output.matchScore}% (${output.verdict}).`,
        payload: { screeningId, matchScore: output.matchScore, verdict: output.verdict },
      });
    }

    logger.info({ screeningId, matchScore: output.matchScore }, 'Screening completed');
    return { screeningId, matchScore: output.matchScore, verdict: output.verdict };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Screening failed';
    logger.error({ err, screeningId }, 'Screening failed');

    await prisma.screening.update({
      where: { id: screeningId },
      data: {
        status: ScreeningStatus.FAILED,
        errorMessage: message,
        completedAt: new Date(),
      },
    });

    await recordBatchScreeningOutcome(screening.batchId, false);
    await usageService.track(organizationId, USAGE_METRICS.SCREENINGS_FAILED);

    throw err;
  }
}
