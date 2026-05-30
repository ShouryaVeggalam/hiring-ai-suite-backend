import type { Role } from '@prisma/client';

export interface JwtAccessPayload {
  sub: string;
  orgId: string;
  email: string;
  role: Role;
  type: 'access';
}

export interface JwtRefreshPayload {
  sub: string;
  orgId: string;
  type: 'refresh';
  jti: string;
}

export interface AuthUserDto {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  organizationId: string;
}

export interface AuthTokensDto {
  accessToken: string;
  expiresIn: string;
}
