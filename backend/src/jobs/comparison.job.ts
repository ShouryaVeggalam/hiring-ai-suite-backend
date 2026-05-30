import { ComparisonStatus, Prisma } from '@prisma/client';
import type { Job } from 'bullmq';
import { getLogger } from '../config/logger';
import { getPrisma } from '../config/prisma';
import { createComparisonProvider } from '../providers/ai/provider.factory';
import type { ComparisonJobData } from '../types/queue.types';

const logger = getLogger();
const prisma = getPrisma();

export async function processComparisonJob(job: Job<ComparisonJobData>) {
  const { comparisonId, organizationId } = job.data;
  logger.info({ comparisonId, jobId: job.id }, 'Running candidate comparison');

  const comparison = await prisma.comparison.findFirst({
    where: { id: comparisonId, organizationId },
    include: {
      job: true,
      candidates: {
        include: {
          candidate: {
            include: {
              resumes: {
                where: { deletedAt: null, status: 'COMPLETED' },
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
              screenings: {
                where: { status: 'COMPLETED' },
                orderBy: { matchScore: 'desc' },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!comparison || comparison.candidates.length < 2) {
    throw new Error(`Comparison not found or insufficient candidates: ${comparisonId}`);
  }

  const provider = createComparisonProvider();

  try {
    const candidatePayload = comparison.candidates.map((row) => {
      const latestScreening = row.candidate.screenings[0];
      const latestResume = row.candidate.resumes[0];
      return {
        candidateId: row.candidateId,
        fullName: row.candidate.fullName,
        resumeText: latestResume?.parsedText ?? undefined,
        matchScore: latestScreening?.matchScore ?? undefined,
      };
    });

    const output = await provider.compare({
      jobDescription: comparison.job?.description,
      candidates: candidatePayload,
    });

    await prisma.comparison.update({
      where: { id: comparisonId },
      data: {
        status: ComparisonStatus.COMPLETED,
        winnerCandidateId: output.winnerCandidateId,
        reasoning: output.reasoning,
        recommendation: output.recommendation,
        skillComparison: output.skillComparison as unknown as Prisma.InputJsonValue,
        scoreComparison: output.scoreComparison as unknown as Prisma.InputJsonValue,
        errorMessage: null,
      },
    });

    logger.info({ comparisonId, winner: output.winnerCandidateId }, 'Comparison completed');
    return output;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Comparison failed';
    await prisma.comparison.update({
      where: { id: comparisonId },
      data: { status: ComparisonStatus.FAILED, errorMessage: message },
    });
    throw err;
  }
}
