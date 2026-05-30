import { getConfig } from '../config';
import { ApiError } from '../utils/ApiError';

export type VirusScanStatus = 'pending' | 'clean' | 'skipped';

export class FileValidationService {
  getAllowedMimeTypes(): string[] {
    return getConfig()
      .UPLOAD_ALLOWED_MIME.split(',')
      .map((m) => m.trim())
      .filter(Boolean);
  }

  validateUpload(file: { size: number; mimetype: string }): void {
    const config = getConfig();

    if (!file) {
      throw ApiError.badRequest('Resume file is required');
    }

    if (file.size > config.UPLOAD_MAX_BYTES) {
      throw ApiError.badRequest(
        `File exceeds maximum size of ${config.UPLOAD_MAX_BYTES} bytes`,
      );
    }

    const allowed = this.getAllowedMimeTypes();
    if (!allowed.includes(file.mimetype)) {
      throw ApiError.badRequest(`File type not allowed. Allowed: ${allowed.join(', ')}`);
    }
  }

  /** Placeholder for ClamAV / cloud AV integration. */
  async scanForVirus(_buffer: Buffer): Promise<VirusScanStatus> {
    const config = getConfig();
    if (!config.VIRUS_SCAN_ENABLED) {
      return 'skipped';
    }
    return 'clean';
  }
}

export const fileValidationService = new FileValidationService();
