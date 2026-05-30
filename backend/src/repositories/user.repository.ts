import type { Prisma, Role, User } from '@prisma/client';
import { getPrisma } from '../config/prisma';
import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository {
  constructor() {
    super(getPrisma());
  }

  findById(id: string) {
    return this.prisma.user.findFirst({
      where: { id, deletedAt: null, isActive: true },
      include: { organization: true },
    });
  }

  findByEmail(organizationId: string, email: string) {
    return this.prisma.user.findFirst({
      where: {
        organizationId,
        email: email.toLowerCase(),
        deletedAt: null,
      },
    });
  }

  findByEmailGlobal(email: string) {
    return this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
      include: { organization: true },
    });
  }

  findByResetTokenHash(tokenHash: string) {
    return this.prisma.user.findFirst({
      where: {
        resetTokenHash: tokenHash,
        resetTokenExpiry: { gt: new Date() },
        deletedAt: null,
        isActive: true,
      },
    });
  }

  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  update(id: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({ where: { id }, data });
  }

  updateRefreshToken(id: string, refreshTokenHash: string | null) {
    return this.prisma.user.update({
      where: { id },
      data: { refreshTokenHash },
    });
  }

  clearResetToken(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { resetTokenHash: null, resetTokenExpiry: null },
    });
  }

  toAuthUser(user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as Role,
      organizationId: user.organizationId,
    };
  }
}
