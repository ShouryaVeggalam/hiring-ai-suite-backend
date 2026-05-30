import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { getLogger } from '../config/logger';
import { ApiError } from '../utils/ApiError';
import { fail } from '../utils/ApiResponse';

export function errorMiddleware(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const logger = getLogger();

  if (err instanceof ApiError) {
    logger.warn({ err, requestId: req.requestId }, err.message);
    return res.status(err.statusCode).json(fail(err.message, err.code, err.details));
  }

  if (err instanceof ZodError) {
    return res.status(400).json(fail('Validation failed', 'VALIDATION_ERROR', err.flatten()));
  }

  logger.error({ err, requestId: req.requestId }, 'Unhandled error');
  return res.status(500).json(fail('Internal server error', 'INTERNAL_ERROR'));
}
