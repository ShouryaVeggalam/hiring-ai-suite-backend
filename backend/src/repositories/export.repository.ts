import { ExportStatus, type Prisma } from '@prisma/client';
import { getPrisma } from '../config/prisma';
import { BaseRepository } from './base.repository';

export class ExportRepository extends BaseRepository {
  constructor() {
    super(getPrisma());
  }

  findById(organizationId: string, id: string) {
    return this.prisma.export.findFirst({
      where: { id, organizationId },
    });
  }

  create(data: Prisma.ExportCreateInput) {
    return this.prisma.export.create({ data });
  }

  update(id: string, data: Prisma.ExportUpdateInput) {
    return this.prisma.export.update({ where: { id }, data });
  }

  markCompleted(
    id: string,
    data: { storageKey: string; fileName: string; sizeBytes: number },
  ) {
    return this.prisma.export.update({
      where: { id },
      data: {
        ...data,
        status: ExportStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }

  findMany(organizationId: string, options: { skip: number; take: number }) {
    return this.prisma.export.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      skip: options.skip,
      take: options.take,
    });
  }

  count(organizationId: string) {
    return this.prisma.export.count({ where: { organizationId } });
  }
}
