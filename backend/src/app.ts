import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { getConfig } from './config';
import { registerContainer } from './config/container';
import { getLogger } from './config/logger';
import { createSwaggerSpec } from './config/swagger';
import { errorMiddleware } from './middleware/error.middleware';
import { globalRateLimiter } from './middleware/rateLimiter.middleware';
import { notFoundMiddleware } from './middleware/notFound.middleware';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import { createApiRouter } from './routes';

export function createApp() {
  registerContainer();

  const config = getConfig();
  const logger = getLogger();
  const app = express();

  app.set('trust proxy', config.TRUST_PROXY);

  app.use(helmet());
  app.use(
    cors({
      origin: config.CORS_ORIGINS.split(',').map((o) => o.trim()),
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(requestIdMiddleware);
  app.use(
    pinoHttp({
      logger,
      customProps: (req) => ({ requestId: req.requestId }),
    }),
  );
  app.use(globalRateLimiter());

  if (config.SWAGGER_ENABLED) {
    const spec = createSwaggerSpec();
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));
  }

  app.use(config.API_PREFIX, createApiRouter());

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
