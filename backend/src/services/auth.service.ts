import { Role, SubscriptionPlan } from '@prisma/client';
import type { Request } from 'express';
import { getConfig } from '../config';
import { getLogger } from '../config/logger';
import type { AuthTokensDto, AuthUserDto } from '../types/auth.types';
import { ApiError } from '../utils/ApiError';
import { generateSecureToken, hashToken } from '../utils/crypto';
import { appendRandomSuffix, slugify } from '../utils/slug';
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from '../validators/auth.validator';
import { AuditService } from './audit.service';
import { OrganizationRepository } from '../repositories/organization.repository';
import { UserRepository } from '../repositories/user.repository';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

export interface AuthResult {
  user: AuthUserDto;
  tokens: AuthTokensDto;
  refreshToken: string;
}

export class AuthService {
  constructor(
    private readonly userRepo = new UserRepository(),
    private readonly orgRepo = new OrganizationRepository(),
    private readonly passwordService = new PasswordService(),
    private readonly tokenService = new TokenService(),
    private readonly auditService = new AuditService(),
  ) {}

  async register(input: RegisterInput, req?: Request): Promise<AuthResult> {
    const email = input.email.toLowerCase();

    const existing = await this.userRepo.findByEmailGlobal(email);
    if (existing) {
      throw ApiError.conflict('An account with this email already exists');
    }

    const baseSlug = slugify(input.organizationName) || 'org';
    let slug = baseSlug;
    let attempts = 0;
    while ((await this.orgRepo.findBySlug(slug)) && attempts < 5) {
      slug = appendRandomSuffix(baseSlug);
      attempts += 1;
    }
    if (await this.orgRepo.findBySlug(slug)) {
      throw ApiError.conflict('Could not create organization slug');
    }

    const passwordHash = await this.passwordService.hash(input.password);

    const { organization, user } = await this.orgRepo.createWithAdmin({
      organization: {
        name: input.organizationName,
        slug,
        subscription: {
          create: {
            plan: SubscriptionPlan.FREE,
            seats: 5,
            monthlyQuota: 100,
          },
        },
      },
      user: {
        email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        role: Role.ADMIN,
        emailVerifiedAt: null,
      },
    });

    const tokens = this.tokenService.createTokenPair(user);
    await this.userRepo.updateRefreshToken(user.id, tokens.refreshTokenHash);

    await this.auditService.log('AUTH_REGISTER', {
      organizationId: organization.id,
      userId: user.id,
      req,
      metadata: { email },
    });

    return {
      user: this.userRepo.toAuthUser(user),
      tokens: { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn },
      refreshToken: tokens.refreshToken,
    };
  }

  async login(input: LoginInput, req?: Request): Promise<AuthResult> {
    const email = input.email.toLowerCase();
    const user = await this.userRepo.findByEmailGlobal(email);

    if (!user || !user.isActive || user.deletedAt) {
      await this.safeAuditLoginFailure(email, user?.organizationId, req);
      throw ApiError.unauthorized('Invalid email or password');
    }

    const valid = await this.passwordService.compare(input.password, user.passwordHash);
    if (!valid) {
      await this.safeAuditLoginFailure(email, user.organizationId, req, user.id);
      throw ApiError.unauthorized('Invalid email or password');
    }

    const tokens = this.tokenService.createTokenPair(user);
    await this.userRepo.update(user.id, {
      refreshTokenHash: tokens.refreshTokenHash,
      lastLoginAt: new Date(),
    });

    await this.auditService.log('AUTH_LOGIN', {
      organizationId: user.organizationId,
      userId: user.id,
      req,
    });

    return {
      user: this.userRepo.toAuthUser(user),
      tokens: { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn },
      refreshToken: tokens.refreshToken,
    };
  }

  async refresh(refreshToken: string, req?: Request): Promise<AuthResult> {
    let payload;
    try {
      payload = this.tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await this.userRepo.findById(payload.sub);
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    const tokenHash = hashToken(refreshToken);
    if (user.refreshTokenHash !== tokenHash) {
      await this.auditService.log('AUTH_REFRESH_REJECTED', {
        organizationId: user.organizationId,
        userId: user.id,
        success: false,
        req,
      });
      throw ApiError.unauthorized('Refresh token revoked');
    }

    const tokens = this.tokenService.createTokenPair(user);
    await this.userRepo.updateRefreshToken(user.id, tokens.refreshTokenHash);

    await this.auditService.log('AUTH_REFRESH', {
      organizationId: user.organizationId,
      userId: user.id,
      req,
    });

    return {
      user: this.userRepo.toAuthUser(user),
      tokens: { accessToken: tokens.accessToken, expiresIn: tokens.expiresIn },
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: string, req?: Request): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      return;
    }

    await this.userRepo.updateRefreshToken(userId, null);

    await this.auditService.log('AUTH_LOGOUT', {
      organizationId: user.organizationId,
      userId: user.id,
      req,
    });
  }

  async forgotPassword(input: ForgotPasswordInput, req?: Request): Promise<void> {
    const email = input.email.toLowerCase();
    const user = await this.userRepo.findByEmailGlobal(email);

    if (!user || !user.isActive) {
      return;
    }

    const rawToken = generateSecureToken(32);
    const resetTokenHash = hashToken(rawToken);
    const resetTokenExpiry = this.tokenService.getPasswordResetExpiry();

    await this.userRepo.update(user.id, { resetTokenHash, resetTokenExpiry });

    const config = getConfig();
    const resetUrl = `${config.APP_URL}${config.API_PREFIX}/auth/reset-password?token=${rawToken}`;

    const logger = getLogger();
    if (config.EMAIL_PROVIDER === 'console') {
      logger.info({ email, resetUrl }, 'Password reset link (dev)');
    }

    await this.auditService.log('AUTH_FORGOT_PASSWORD', {
      organizationId: user.organizationId,
      userId: user.id,
      req,
      metadata: { email },
    });
  }

  async resetPassword(input: ResetPasswordInput, req?: Request): Promise<void> {
    const tokenHash = hashToken(input.token);
    const user = await this.userRepo.findByResetTokenHash(tokenHash);

    if (!user) {
      throw ApiError.badRequest('Invalid or expired reset token');
    }

    const passwordHash = await this.passwordService.hash(input.password);

    await this.userRepo.update(user.id, {
      passwordHash,
      resetTokenHash: null,
      resetTokenExpiry: null,
      refreshTokenHash: null,
    });

    await this.auditService.log('AUTH_RESET_PASSWORD', {
      organizationId: user.organizationId,
      userId: user.id,
      req,
    });
  }

  async getMe(userId: string): Promise<AuthUserDto> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }
    return this.userRepo.toAuthUser(user);
  }

  private async safeAuditLoginFailure(
    email: string,
    organizationId?: string,
    req?: Request,
    userId?: string,
  ) {
    if (!organizationId) return;
    await this.auditService.log('AUTH_LOGIN_FAILED', {
      organizationId,
      userId,
      success: false,
      req,
      metadata: { email },
    });
  }
}

export const authService = new AuthService();
