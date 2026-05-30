process.env.JWT_ACCESS_SECRET = 'test_access_secret_16';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_16';
process.env.DATABASE_URL = 'postgresql://localhost:5432/test';

import { Role } from '@prisma/client';
import { resetConfigForTests } from '../../src/config';
import { TokenService } from '../../src/services/token.service';

describe('TokenService', () => {
  const service = new TokenService();

  beforeEach(() => {
    resetConfigForTests();
  });

  const user = {
    id: 'user_1',
    organizationId: 'org_1',
    email: 'test@example.com',
    role: Role.ADMIN,
  };

  it('creates verifiable access and refresh tokens', () => {
    const pair = service.createTokenPair(user);
    const access = service.verifyAccessToken(pair.accessToken);
    const refresh = service.verifyRefreshToken(pair.refreshToken);

    expect(access.sub).toBe(user.id);
    expect(access.orgId).toBe(user.organizationId);
    expect(refresh.sub).toBe(user.id);
    expect(refresh.jti).toBeDefined();
  });
});
