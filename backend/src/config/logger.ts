import pino from 'pino';
import { getConfig } from './index';

export function createLogger() {
  const config = getConfig();
  return pino({
    name: config.APP_NAME,
    level: config.LOG_LEVEL,
    transport:
      config.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  });
}

let loggerInstance: ReturnType<typeof createLogger> | null = null;

export function getLogger() {
  if (!loggerInstance) {
    loggerInstance = createLogger();
  }
  return loggerInstance;
}
