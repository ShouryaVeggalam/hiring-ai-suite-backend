import { Router } from 'express';
import {
  deleteScreening,
  getResumeDownloadUrl,
  getScreening,
  listScreenings,
  runScreening,
  screeningDeleteRoles,
  screeningWriteRoles,
  uploadResume,
} from '../../controllers/screening.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { resumeUploadMiddleware } from '../../middleware/upload.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  listScreeningsQuerySchema,
  resumeIdParamSchema,
  runScreeningSchema,
  screeningIdParamSchema,
  uploadResumeFieldsSchema,
} from '../../validators/screening.validator';

const router = Router();

router.use(authMiddleware);

router.post(
  '/screening/upload',
  roleMiddleware(...screeningWriteRoles),
  resumeUploadMiddleware,
  validate(uploadResumeFieldsSchema),
  uploadResume,
);

router.post(
  '/screening/run',
  roleMiddleware(...screeningWriteRoles),
  validate(runScreeningSchema),
  runScreening,
);

router.get('/screening/results', validate(listScreeningsQuerySchema, 'query'), listScreenings);

router.get(
  '/screening/resume/:resumeId/download',
  validate(resumeIdParamSchema, 'params'),
  getResumeDownloadUrl,
);

router.get('/screening/:id', validate(screeningIdParamSchema, 'params'), getScreening);

router.delete(
  '/screening/:id',
  roleMiddleware(...screeningDeleteRoles),
  validate(screeningIdParamSchema, 'params'),
  deleteScreening,
);

export default router;
