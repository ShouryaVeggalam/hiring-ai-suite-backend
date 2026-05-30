import type { Prisma } from '@prisma/client';
import { getPrisma } from '../config/prisma';
import { BaseRepository } from './base.repository';

export class OrganizationRepository extends BaseRepository {
  constructor() {
    super(getPrisma());
  }

  findBySlug(slug: string) {
    return this.prisma.organization.findFirst({
      where: { slug, deletedAt: null, isActive: true },
    });
  }

  findById(id: string) {
    return this.prisma.organization.findFirst({
      where: { id, deletedAt: null, isActive: true },
    });
  }

  createWithAdmin(data: {
    organization: Prisma.OrganizationCreateInput;
    user: Omit<Prisma.UserCreateInput, 'organization'>;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: data.organization,
      });

      const user = await tx.user.create({
        data: {
          ...data.user,
          email: data.user.email.toLowerCase(),
          organizationId: organization.id,
        },
      });

      return { organization, user };
    });
  }
}
