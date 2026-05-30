import { QuestionSetStatus, type Prisma } from '@prisma/client';
import { getPrisma } from '../config/prisma';
import { BaseRepository } from './base.repository';

export class QuestionSetRepository extends BaseRepository {
  constructor() {
    super(getPrisma());
  }

  findById(organizationId: string, id: string) {
    return this.prisma.questionSet.findFirst({
      where: { id, organizationId },
      include: {
        job: { select: { id: true, title: true } },
        candidate: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  findMany(organizationId: string, options: { skip: number; take: number; jobId?: string }) {
    return this.prisma.questionSet.findMany({
      where: {
        organizationId,
        ...(options.jobId ? { jobId: options.jobId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip: options.skip,
      take: options.take,
    });
  }

  count(organizationId: string, jobId?: string) {
    return this.prisma.questionSet.count({
      where: { organizationId, ...(jobId ? { jobId } : {}) },
    });
  }

  create(data: Prisma.QuestionSetCreateInput) {
    return this.prisma.questionSet.create({ data });
  }

  update(id: string, data: Prisma.QuestionSetUpdateInput) {
    return this.prisma.questionSet.update({ where: { id }, data });
  }

  updateStatus(id: string, status: QuestionSetStatus, extra?: Prisma.QuestionSetUpdateInput) {
    return this.prisma.questionSet.update({
      where: { id },
      data: { status, ...extra },
    });
  }
}
