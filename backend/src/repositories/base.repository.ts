import type { PrismaClient } from '@prisma/client';

export abstract class BaseRepository {
  constructor(protected readonly prisma: PrismaClient) {}

  protected tenantWhere(organizationId: string) {
    return { organizationId };
  }
}
