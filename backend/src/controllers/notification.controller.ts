import type { Request, Response } from 'express';
import { notificationService } from '../services/notification.service';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/ApiResponse';

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationService.list(
    req.user!.organizationId,
    req.user!.id,
    req.query,
  );
  res.json(ok(result.items, result.meta));
});

export const markNotificationRead = asyncHandler(async (req: Request, res: Response) => {
  const updated = await notificationService.markRead(
    req.user!.organizationId,
    req.user!.id,
    String(req.params.id),
  );
  if (!updated) {
    throw ApiError.notFound('Notification not found');
  }
  res.json(ok({ read: true }));
});
