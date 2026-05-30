import { Router } from 'express';
import {
  exportQuestions,
  generateQuestions,
  getQuestionSet,
  questionWriteRoles,
} from '../../controllers/question.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  exportQuestionsSchema,
  generateQuestionsSchema,
  questionIdParamSchema,
} from '../../validators/question.validator';

const router = Router();

router.use(authMiddleware);

router.post(
  '/questions/generate',
  roleMiddleware(...questionWriteRoles),
  validate(generateQuestionsSchema),
  generateQuestions,
);

router.get('/questions/:id', validate(questionIdParamSchema, 'params'), getQuestionSet);

router.post(
  '/questions/export',
  roleMiddleware(...questionWriteRoles),
  validate(exportQuestionsSchema),
  exportQuestions,
);

export default router;
