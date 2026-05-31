import Redis from 'ioredis';
import { getConfig } from './index';

let redisClient: Redis | null = null;

export function getRedis(): Redis {
  if (!redisClient) {
    const config = getConfig();
    // rediss:// implies TLS; ioredis only enables TLS for that scheme when we
    // pass the URL as a string AND we don't override options. To stay explicit
    // and consistent with the BullMQ connection helper, derive TLS from either
    // the scheme or the REDIS_TLS flag.
    const useTls = config.REDIS_URL.startsWith('rediss://') || config.REDIS_TLS;
    redisClient = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: null,
      tls: useTls ? {} : undefined,
      enableReadyCheck: false,
      connectTimeout: 15_000,
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
