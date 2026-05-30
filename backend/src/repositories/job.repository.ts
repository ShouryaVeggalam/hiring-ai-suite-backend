import type { JobStatus, Prisma } from '@prisma/client';
import { getPrisma } from '../config/prisma';
import { BaseRepository } from './base.repository';

export class JobRepository extends BaseRepository {
  constructor() {
    super(getPrisma());
  }

  findById(organizationId: string, id: string) {
    return this.prisma.job.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
  }

  findMany(
    organizationId: string,
    options: { skip: number; take: number; status?: JobStatus },
  ) {
    return this.prisma.job.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(options.status ? { status: options.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip: options.skip,
      take: options.take,
    });
  }

  count(organizationId: string, status?: JobStatus) {
    return this.prisma.job.count({
      where: {
        organizationId,
        deletedAt: null,
        ...(status ? { status } : {}),
      },
    });
  }

  create(data: Prisma.JobCreateInput) {
    return this.prisma.job.create({ data });
  }
}
