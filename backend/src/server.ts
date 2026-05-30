import { createApp } from './app';
import { getConfig } from './config';
import { getLogger } from './config/logger';
import { disconnectPrisma } from './config/prisma';
import { disconnectRedis } from './config/redis';

async function bootstrap() {
  const config = getConfig();
  const logger = getLogger();
  const app = createApp();

  const server = app.listen(config.PORT, () => {
    logger.info(
      { port: config.PORT, env: config.NODE_ENV, prefix: config.API_PREFIX },
      'HIRING AI SUITE API started',
    );
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down gracefully');
    server.close(async () => {
      await disconnectPrisma();
      await disconnectRedis();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
