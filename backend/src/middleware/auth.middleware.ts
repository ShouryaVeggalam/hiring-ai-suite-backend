import type { NextFunction, Request, Response } from 'express';
import { UserRepository } from '../repositories/user.repository';
import { tokenService } from '../services/token.service';
import { ApiError } from '../utils/ApiError';

const userRepo = new UserRepository();

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw ApiError.unauthorized('Missing or invalid authorization header');
    }

    const token = authHeader.slice(7);
    const payload = tokenService.verifyAccessToken(token);

    const user = await userRepo.findById(payload.sub);
    if (!user || user.organizationId !== payload.orgId) {
      throw ApiError.unauthorized('User not found or inactive');
    }

    req.user = {
      id: user.id,
      organizationId: user.organizationId,
      email: user.email,
      role: user.role,
    };
    req.tenant = { organizationId: user.organizationId };

    return next();
  } catch (err) {
    if (err instanceof ApiError) {
      return next(err);
    }
    return next(ApiError.unauthorized('Invalid or expired token'));
  }
}

export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }
  return authMiddleware(req, _res, next);
}
