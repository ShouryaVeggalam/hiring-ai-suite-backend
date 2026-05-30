import type { ConnectionOptions } from 'bullmq';
import { getConfig } from './index';

export function getQueueConnection(): ConnectionOptions {
  const config = getConfig();
  const url = new URL(config.REDIS_URL);
  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 6379,
    password: url.password || undefined,
    maxRetriesPerRequest: null,
  };
}

export const QUEUE_NAMES = {
  RESUME_PROCESSING: 'resume-processing',
  SCREENING: 'screening',
  QUESTION_GENERATION: 'question-generation',
  COMPARISON: 'comparison',
  EXPORT: 'export',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export function getPrefixedQueueName(name: QueueName): string {
  const config = getConfig();
  return `${config.QUEUE_PREFIX}-${name}`;
}
