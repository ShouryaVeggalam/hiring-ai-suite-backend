import { Router } from 'express';
import { listNotifications, markNotificationRead } from '../../controllers/notification.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  listNotificationsQuerySchema,
  notificationIdParamSchema,
} from '../../validators/notification.validator';

const router = Router();

router.use(authMiddleware);

router.get('/notifications', validate(listNotificationsQuerySchema, 'query'), listNotifications);

router.patch(
  '/notifications/:id/read',
  validate(notificationIdParamSchema, 'params'),
  markNotificationRead,
);

export default router;
