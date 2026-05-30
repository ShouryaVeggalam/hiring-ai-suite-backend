import type { Request, Response } from 'express';
import { fail } from '../utils/ApiResponse';

export function notFoundMiddleware(req: Request, res: Response) {
  res.status(404).json(fail(`Route not found: ${req.method} ${req.path}`, 'NOT_FOUND'));
}
