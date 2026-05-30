/**
 * Combined entry point: HTTP API + BullMQ workers in a single Node process.
 *
 * Used by Render's free web service plan (one always-on process per app).
 * The HTTP server listens on $PORT; the workers consume the same Redis the
 * API enqueues to.
 *
 * Run locally with: npm run start:combined
 */
import { createApp } from './app';
import { getConfig } from './config';
import { getLogger } from './config/logger';
import { disconnectPrisma } from './config/prisma';
import { disconnectRedis } from './config/redis';

import { Worker } from 'bullmq';
import { getPrefixedQueueName, getQueueConnection, QUEUE_NAMES } from './config/queue';
import { processComparisonJob } from './jobs/comparison.job';
import { processExportJob } from './jobs/export.job';
import { processQuestionGenerationJob } from './jobs/questionGeneration.job';
import { processResumeJob } from './jobs/resumeProcessing.job';
import { processScreeningJob } from './jobs/screening.job';

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

async function bootstrap() {
  const config = getConfig();
  const app = createApp();

  const server = app.listen(config.PORT, () => {
    logger.info(
      { port: config.PORT, env: config.NODE_ENV, prefix: config.API_PREFIX },
      'HIRING AI SUITE (combined API + workers) started',
    );
  });

  const workers = [
    createWorker<import('./types/queue.types').ResumeProcessingJobData>(
      'RESUME_PROCESSING',
      processResumeJob,
    ),
    createWorker<import('./types/queue.types').ScreeningJobData>(
      'SCREENING',
      processScreeningJob,
    ),
    createWorker<import('./types/queue.types').QuestionGenerationJobData>(
      'QUESTION_GENERATION',
      processQuestionGenerationJob,
    ),
    createWorker<import('./types/queue.types').ComparisonJobData>(
      'COMPARISON',
      processComparisonJob,
    ),
    createWorker<import('./types/queue.types').ExportJobData>('EXPORT', processExportJob),
  ];
  logger.info({ workers: workers.length }, 'BullMQ workers attached to combined process');

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Combined process shutting down');
    server.close(async () => {
      await Promise.allSettled(workers.map((w) => w.close()));
      await disconnectPrisma();
      await disconnectRedis();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 15_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Combined process failed to start');
  process.exit(1);
});
