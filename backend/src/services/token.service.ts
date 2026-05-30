import jwt, { type SignOptions } from 'jsonwebtoken';
import { getConfig } from '../config';
import type { JwtAccessPayload, JwtRefreshPayload } from '../types/auth.types';
import { generateSecureToken, hashToken } from '../utils/crypto';
import { parseDurationToMs } from '../utils/parseDuration';
import type { Role } from '@prisma/client';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenHash: string;
  refreshJti: string;
  expiresIn: string;
}

export class TokenService {
  signAccessToken(user: { id: string; organizationId: string; email: string; role: Role }): string {
    const config = getConfig();
    const payload: JwtAccessPayload = {
      sub: user.id,
      orgId: user.organizationId,
      email: user.email,
      role: user.role,
      type: 'access',
    };
    return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
      expiresIn: config.JWT_ACCESS_TTL as SignOptions['expiresIn'],
    });
  }

  signRefreshToken(userId: string, organizationId: string, jti: string): string {
    const config = getConfig();
    const payload: JwtRefreshPayload = {
      sub: userId,
      orgId: organizationId,
      type: 'refresh',
      jti,
    };
    return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
      expiresIn: config.JWT_REFRESH_TTL as SignOptions['expiresIn'],
    });
  }

  createTokenPair(user: { id: string; organizationId: string; email: string; role: Role }): TokenPair {
    const config = getConfig();
    const jti = generateSecureToken(16);
    const refreshToken = this.signRefreshToken(user.id, user.organizationId, jti);
    const accessToken = this.signAccessToken(user);

    return {
      accessToken,
      refreshToken,
      refreshTokenHash: hashToken(refreshToken),
      refreshJti: jti,
      expiresIn: config.JWT_ACCESS_TTL,
    };
  }

  verifyAccessToken(token: string): JwtAccessPayload {
    const config = getConfig();
    const payload = jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtAccessPayload;
    if (payload.type !== 'access') {
      throw new Error('Invalid token type');
    }
    return payload;
  }

  verifyRefreshToken(token: string): JwtRefreshPayload {
    const config = getConfig();
    const payload = jwt.verify(token, config.JWT_REFRESH_SECRET) as JwtRefreshPayload;
    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return payload;
  }

  getPasswordResetExpiry(): Date {
    const config = getConfig();
    const ms = parseDurationToMs(config.PASSWORD_RESET_TTL);
    return new Date(Date.now() + ms);
  }
}

export const tokenService = new TokenService();
