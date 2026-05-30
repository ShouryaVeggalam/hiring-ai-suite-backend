import { ScreeningStatus, Verdict, type Prisma } from '@prisma/client';
import { getPrisma } from '../config/prisma';
import { BaseRepository } from './base.repository';

export interface BatchScreeningFilters {
  jobId?: string;
  status?: ScreeningStatus;
  batchId?: string;
  minScore?: number;
  verdict?: Verdict;
  search?: string;
}

export class ScreeningRepository extends BaseRepository {
  constructor() {
    super(getPrisma());
  }

  findById(organizationId: string, id: string) {
    return this.prisma.screening.findFirst({
      where: { id, organizationId },
      include: {
        result: true,
        job: { select: { id: true, title: true, skills: true } },
        resume: { select: { id: true, parsedText: true, status: true } },
        candidate: { select: { id: true, fullName: true, email: true } },
      },
    });
  }

  findMany(
    organizationId: string,
    options: BatchScreeningFilters & { skip: number; take: number },
  ) {
    return this.prisma.screening.findMany({
      where: this.buildWhere(organizationId, options),
      include: {
        result: true,
        job: { select: { id: true, title: true } },
        resume: { select: { id: true } },
        candidate: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: options.skip,
      take: options.take,
    });
  }

  findManyRanked(
    organizationId: string,
    options: BatchScreeningFilters & { skip: number; take: number },
  ) {
    return this.prisma.screening.findMany({
      where: this.buildWhere(organizationId, options),
      include: {
        result: true,
        job: { select: { id: true, title: true } },
        resume: { select: { id: true } },
        candidate: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: [{ matchScore: 'desc' }, { createdAt: 'desc' }],
      skip: options.skip,
      take: options.take,
    });
  }

  count(organizationId: string, filters: BatchScreeningFilters) {
    return this.prisma.screening.count({
      where: this.buildWhere(organizationId, filters),
    });
  }

  create(data: Prisma.ScreeningCreateInput) {
    return this.prisma.screening.create({ data });
  }

  update(id: string, data: Prisma.ScreeningUpdateInput) {
    return this.prisma.screening.update({ where: { id }, data });
  }

  updateStatus(id: string, status: ScreeningStatus, extra?: Prisma.ScreeningUpdateInput) {
    return this.prisma.screening.update({
      where: { id },
      data: { status, ...extra },
    });
  }

  delete(organizationId: string, id: string) {
    return this.prisma.screening.deleteMany({
      where: { id, organizationId },
    });
  }

  private buildWhere(organizationId: string, filters: BatchScreeningFilters): Prisma.ScreeningWhereInput {
    return {
      organizationId,
      ...(filters.jobId ? { jobId: filters.jobId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.batchId ? { batchId: filters.batchId } : {}),
      ...(filters.verdict ? { verdict: filters.verdict } : {}),
      ...(filters.minScore != null ? { matchScore: { gte: filters.minScore } } : {}),
      ...(filters.search
        ? {
            candidate: {
              fullName: { contains: filters.search, mode: 'insensitive' },
            },
          }
        : {}),
    };
  }
}
