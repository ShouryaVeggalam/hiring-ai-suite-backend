import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { getConfig } from '../config';
import { ApiError } from '../utils/ApiError';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: getConfig().UPLOAD_MAX_BYTES },
});

const multiUpload = upload.array('files', 25);

export function batchUploadMiddleware(req: Request, res: Response, next: NextFunction) {
  multiUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(ApiError.badRequest('One or more files exceed size limit'));
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return next(ApiError.badRequest('Too many files (max 25)'));
      }
      return next(ApiError.badRequest(err.message));
    }
    if (err) {
      return next(err);
    }
    return next();
  });
}
