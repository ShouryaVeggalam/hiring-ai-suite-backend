import { Queue } from 'bullmq';
import { getConfig } from '../config';
import { getPrefixedQueueName, getQueueConnection, QUEUE_NAMES } from '../config/queue';

function createQueue(name: keyof typeof QUEUE_NAMES) {
  const config = getConfig();
  return new Queue(getPrefixedQueueName(QUEUE_NAMES[name]), {
    connection: getQueueConnection(),
    defaultJobOptions: {
      attempts: config.QUEUE_DEFAULT_ATTEMPTS,
      backoff: { type: 'exponential', delay: config.QUEUE_DEFAULT_BACKOFF_MS },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    },
  });
}

export const resumeProcessingQueue = () => createQueue('RESUME_PROCESSING');
export const screeningQueue = () => createQueue('SCREENING');
export const questionGenerationQueue = () => createQueue('QUESTION_GENERATION');
export const comparisonQueue = () => createQueue('COMPARISON');
export const exportQueue = () => createQueue('EXPORT');
