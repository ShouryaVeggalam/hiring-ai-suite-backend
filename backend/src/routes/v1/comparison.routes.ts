import { Router } from 'express';
import {
  comparisonWriteRoles,
  createComparison,
  getComparison,
} from '../../controllers/comparison.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  comparisonIdParamSchema,
  createComparisonSchema,
} from '../../validators/comparison.validator';

const router = Router();

router.use(authMiddleware);

router.post(
  '/comparison',
  roleMiddleware(...comparisonWriteRoles),
  validate(createComparisonSchema),
  createComparison,
);

router.get('/comparison/:id', validate(comparisonIdParamSchema, 'params'), getComparison);

export default router;
