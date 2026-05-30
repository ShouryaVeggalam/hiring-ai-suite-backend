process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
process.env.JWT_ACCESS_SECRET = 'test_access_secret_16';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_16';

import { resetConfigForTests } from '../../src/config';
import { FileValidationService } from '../../src/services/fileValidation.service';

describe('FileValidationService', () => {
  const service = new FileValidationService();

  beforeEach(() => {
    resetConfigForTests();
  });

  it('rejects missing file', () => {
    expect(() => service.validateUpload(undefined as unknown as { size: number; mimetype: string })).toThrow();
  });

  it('rejects disallowed mime type', () => {
    expect(() =>
      service.validateUpload({
        size: 1000,
        mimetype: 'text/plain',
      }),
    ).toThrow();
  });

  it('accepts pdf mime type', () => {
    expect(() =>
      service.validateUpload({
        size: 1000,
        mimetype: 'application/pdf',
      }),
    ).not.toThrow();
  });
});
