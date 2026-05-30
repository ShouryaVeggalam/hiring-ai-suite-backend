import { Router } from 'express';
import {
  analyticsRoles,
  getJobAnalytics,
  getOverview,
  getUsage,
} from '../../controllers/analytics.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { usagePeriodQuerySchema } from '../../validators/analytics.validator';

const router = Router();

router.use(authMiddleware, roleMiddleware(...analyticsRoles));

router.get('/analytics/overview', getOverview);
router.get('/analytics/usage', validate(usagePeriodQuerySchema, 'query'), getUsage);
router.get('/analytics/jobs', getJobAnalytics);

export default router;
