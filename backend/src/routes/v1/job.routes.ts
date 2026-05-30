import { Router } from 'express';
import { createJob, getJob, jobWriteRoles, listJobs } from '../../controllers/job.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createJobSchema, jobIdParamSchema, listJobsQuerySchema } from '../../validators/job.validator';

const router = Router();

router.use(authMiddleware);

router.post('/jobs', roleMiddleware(...jobWriteRoles), validate(createJobSchema), createJob);
router.get('/jobs', validate(listJobsQuerySchema, 'query'), listJobs);
router.get('/jobs/:id', validate(jobIdParamSchema, 'params'), getJob);

export default router;
