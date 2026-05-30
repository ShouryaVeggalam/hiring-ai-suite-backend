import { Router } from 'express';
import { healthCheck, metricsCheck, readinessCheck } from '../../controllers/health.controller';

const router = Router();

router.get('/health', healthCheck);
router.get('/health/ready', readinessCheck);
router.get('/metrics', metricsCheck);

export default router;
