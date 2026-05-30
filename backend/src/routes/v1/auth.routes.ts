import { Router } from 'express';
import {
  forgotPassword,
  login,
  logout,
  me,
  refresh,
  register,
  resetPassword,
} from '../../controllers/auth.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { authRateLimiter } from '../../middleware/rateLimiter.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenBodySchema,
  registerSchema,
  resetPasswordSchema,
} from '../../validators/auth.validator';

const router = Router();

router.post('/auth/register', authRateLimiter(), validate(registerSchema), register);
router.post('/auth/login', authRateLimiter(), validate(loginSchema), login);
router.post('/auth/refresh', authRateLimiter(), validate(refreshTokenBodySchema), refresh);
router.post('/auth/forgot-password', authRateLimiter(), validate(forgotPasswordSchema), forgotPassword);
router.post('/auth/reset-password', authRateLimiter(), validate(resetPasswordSchema), resetPassword);

router.post('/auth/logout', authMiddleware, logout);
router.get('/auth/me', authMiddleware, me);

export default router;
