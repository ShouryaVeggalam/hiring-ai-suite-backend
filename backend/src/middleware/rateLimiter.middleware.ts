import rateLimit from 'express-rate-limit';
import { getConfig } from '../config';

export function createRateLimiter(max?: number) {
  const config = getConfig();
  return rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: max ?? config.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { message: 'Too many requests', code: 'RATE_LIMIT' } },
  });
}

export const globalRateLimiter = () => createRateLimiter();
export const authRateLimiter = () => createRateLimiter(getConfig().AUTH_RATE_LIMIT_MAX);
