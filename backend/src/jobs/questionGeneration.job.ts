import { Prisma, QuestionSetStatus } from '@prisma/client';
import type { Job } from 'bullmq';
import { getLogger } from '../config/logger';
import { getPrisma } from '../config/prisma';
import { createQuestionProvider } from '../providers/ai/provider.factory';
import type { QuestionGenerationJobData } from '../types/queue.types';

const logger = getLogger();
const prisma = getPrisma();

export async function processQuestionGenerationJob(job: Job<QuestionGenerationJobData>) {
  const { questionSetId, organizationId } = job.data;
  logger.info({ questionSetId, jobId: job.id }, 'Generating interview questions');

  const questionSet = await prisma.questionSet.findFirst({
    where: { id: questionSetId, organizationId },
    include: {
      job: true,
      candidate: true,
    },
  });

  if (!questionSet) {
    throw new Error(`Question set not found: ${questionSetId}`);
  }

  let resumeText: string | undefined;
  if (questionSet.candidateId) {
    const resume = await prisma.resume.findFirst({
      where: {
        organizationId,
        candidateId: questionSet.candidateId,
        deletedAt: null,
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
    });
    resumeText = resume?.parsedText ?? undefined;
  }

  const provider = createQuestionProvider();

  try {
    const jobDescription =
      questionSet.job?.description ??
      'General interview question generation for hiring pipeline.';

    const output = await provider.generate({
      jobTitle: questionSet.job?.title,
      jobDescription,
      resumeText,
      skills: questionSet.job?.skills ?? [],
    });

    await prisma.questionSet.update({
      where: { id: questionSetId },
      data: {
        status: QuestionSetStatus.COMPLETED,
        technical: output.technical as unknown as Prisma.InputJsonValue,
        behavioral: output.behavioral as unknown as Prisma.InputJsonValue,
        skillGap: output.skillGap as unknown as Prisma.InputJsonValue,
        followUps: output.followUps as unknown as Prisma.InputJsonValue,
        providerName: provider.name,
        modelName: output.modelName,
        errorMessage: null,
      },
    });

    logger.info({ questionSetId }, 'Question generation completed');
    return { questionSetId, counts: { technical: output.technical.length } };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Question generation failed';
    logger.error({ err, questionSetId }, 'Question generation failed');

    await prisma.questionSet.update({
      where: { id: questionSetId },
      data: {
        status: QuestionSetStatus.FAILED,
        errorMessage: message,
      },
    });

    throw err;
  }
}
