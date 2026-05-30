import { BatchStatus, type Prisma } from '@prisma/client';
import { getPrisma } from '../config/prisma';
import { BaseRepository } from './base.repository';

export class BatchRepository extends BaseRepository {
  constructor() {
    super(getPrisma());
  }

  findById(organizationId: string, id: string) {
    return this.prisma.batch.findFirst({
      where: { id, organizationId },
      include: {
        job: { select: { id: true, title: true, skills: true } },
        resumes: {
          include: {
            resume: {
              include: {
                file: true,
                candidate: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
        },
        createdBy: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  create(data: Prisma.BatchCreateInput) {
    return this.prisma.batch.create({ data });
  }

  update(id: string, data: Prisma.BatchUpdateInput) {
    return this.prisma.batch.update({ where: { id }, data });
  }

  updateStatus(id: string, status: BatchStatus, extra?: Prisma.BatchUpdateInput) {
    return this.prisma.batch.update({
      where: { id },
      data: { status, ...extra },
    });
  }

  addResume(batchId: string, resumeId: string) {
    return this.prisma.batchResume.create({
      data: { batchId, resumeId },
    });
  }

  incrementProgress(id: string, success: boolean) {
    return this.prisma.batch.update({
      where: { id },
      data: success
        ? { completedCount: { increment: 1 } }
        : { failedCount: { increment: 1 } },
    });
  }
}
