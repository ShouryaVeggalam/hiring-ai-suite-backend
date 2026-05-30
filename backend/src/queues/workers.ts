import { Worker } from 'bullmq';
import { getConfig } from '../config';
import { getLogger } from '../config/logger';
import { disconnectPrisma } from '../config/prisma';
import { getPrefixedQueueName, getQueueConnection, QUEUE_NAMES } from '../config/queue';
import { processComparisonJob } from '../jobs/comparison.job';
import { processExportJob } from '../jobs/export.job';
import { processQuestionGenerationJob } from '../jobs/questionGeneration.job';
import { processResumeJob } from '../jobs/resumeProcessing.job';
import { processScreeningJob } from '../jobs/screening.job';

const logger = getLogger();

function createWorker<T>(
  queueKey: keyof typeof QUEUE_NAMES,
  processor: (job: import('bullmq').Job<T>) => Promise<unknown>,
) {
  const config = getConfig();
  const name = getPrefixedQueueName(QUEUE_NAMES[queueKey]);

  const worker = new Worker<T>(name, processor, {
    connection: getQueueConnection(),
    concurrency: config.WORKER_CONCURRENCY,
  });

  worker.on('completed', (job) => {
    logger.info({ queue: name, jobId: job.id }, 'Job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ queue: name, jobId: job?.id, err }, 'Job failed');
  });

  return worker;
}

const workers = [
  createWorker<import('../types/queue.types').ResumeProcessingJobData>(
    'RESUME_PROCESSING',
    processResumeJob,
  ),
  createWorker<import('../types/queue.types').ScreeningJobData>('SCREENING', processScreeningJob),
  createWorker<import('../types/queue.types').QuestionGenerationJobData>(
    'QUESTION_GENERATION',
    processQuestionGenerationJob,
  ),
  createWorker<import('../types/queue.types').ComparisonJobData>(
    'COMPARISON',
    processComparisonJob,
  ),
  createWorker<import('../types/queue.types').ExportJobData>('EXPORT', processExportJob),
];

logger.info({ count: workers.length }, 'BullMQ workers started');

async function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down workers');
  await Promise.all(workers.map((w) => w.close()));
  await disconnectPrisma();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
