import type { ConnectionOptions } from 'bullmq';
import { getConfig } from './index';

export function getQueueConnection(): ConnectionOptions {
  const config = getConfig();
  const url = new URL(config.REDIS_URL);

  // Honour rediss:// (Upstash, ElastiCache TLS, etc.) and the explicit REDIS_TLS
  // override. Without this, BullMQ opens a plain TCP socket against a TLS-only
  // host and ioredis silently retries forever (maxRetriesPerRequest: null),
  // which makes any queue.add() call hang the request.
  const isTls = url.protocol === 'rediss:' || config.REDIS_TLS;

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 6379,
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    tls: isTls ? { servername: url.hostname } : undefined,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 15_000,
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
