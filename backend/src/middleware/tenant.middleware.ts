import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';

export function tenantMiddleware(req: Request, _res: Response, next: NextFunction) {
  if (!req.user?.organizationId) {
    return next(ApiError.unauthorized('Tenant context required'));
  }
  req.tenant = { organizationId: req.user.organizationId };
  return next();
}
