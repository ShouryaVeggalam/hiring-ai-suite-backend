import { Router } from 'express';
import { getConfig } from '../config';
import authRoutes from './v1/auth.routes';
import healthRoutes from './v1/health.routes';
import jobRoutes from './v1/job.routes';
import analyticsRoutes from './v1/analytics.routes';
import batchRoutes from './v1/batch.routes';
import exportRoutes from './v1/export.routes';
import notificationRoutes from './v1/notification.routes';
import comparisonRoutes from './v1/comparison.routes';
import questionRoutes from './v1/question.routes';
import screeningRoutes from './v1/screening.routes';

export function createApiRouter(): Router {
  const router = Router();
  const config = getConfig();

  router.use(healthRoutes);
  router.use(authRoutes);
  router.use(jobRoutes);
  router.use(screeningRoutes);
  router.use(questionRoutes);
  router.use(comparisonRoutes);
  router.use(batchRoutes);
  router.use(exportRoutes);
  router.use(analyticsRoutes);
  router.use(notificationRoutes);
  router.get('/', (_req, res) => {
    res.json({
      name: config.APP_NAME,
      version: '1.0.0',
      docs: config.SWAGGER_ENABLED ? '/api-docs' : null,
    });
  });

  return router;
}
