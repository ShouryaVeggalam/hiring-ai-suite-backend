import Redis from 'ioredis';
import { getConfig } from './index';

let redisClient: Redis | null = null;

export function getRedis(): Redis {
  if (!redisClient) {
    const config = getConfig();
    redisClient = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: null,
      tls: config.REDIS_TLS ? {} : undefined,
    });
  }
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
