import { Router } from 'express';
import {
  batchWriteRoles,
  getBatch,
  getBatchResults,
  runBatch,
  uploadBatch,
} from '../../controllers/batch.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { batchUploadMiddleware } from '../../middleware/batchUpload.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  batchIdParamSchema,
  batchResultsListQuerySchema,
  batchResultsQuerySchema,
  batchRunSchema,
  batchUploadFieldsSchema,
} from '../../validators/batch.validator';

const router = Router();

router.use(authMiddleware);

router.post(
  '/batch/upload',
  roleMiddleware(...batchWriteRoles),
  batchUploadMiddleware,
  validate(batchUploadFieldsSchema),
  uploadBatch,
);

router.post(
  '/batch/run',
  roleMiddleware(...batchWriteRoles),
  validate(batchRunSchema),
  runBatch,
);

router.get('/batch/results', validate(batchResultsListQuerySchema, 'query'), getBatchResults);

router.get('/batch/:id', validate(batchIdParamSchema, 'params'), getBatch);

router.get(
  '/batch/:id/results',
  validate(batchIdParamSchema, 'params'),
  validate(batchResultsQuerySchema, 'query'),
  getBatchResults,
);

export default router;
