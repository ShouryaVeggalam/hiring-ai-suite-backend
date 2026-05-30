import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { getConfig } from '../config';
import { ApiError } from '../utils/ApiError';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: getConfig().UPLOAD_MAX_BYTES },
});

const singleUpload = upload.single('file');

export function resumeUploadMiddleware(req: Request, res: Response, next: NextFunction) {
  singleUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(ApiError.badRequest('File too large'));
      }
      return next(ApiError.badRequest(err.message));
    }
    if (err) {
      return next(err);
    }
    return next();
  });
}
