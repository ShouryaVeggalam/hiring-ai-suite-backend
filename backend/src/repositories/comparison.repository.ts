import { ComparisonStatus, type Prisma } from '@prisma/client';
import { getPrisma } from '../config/prisma';
import { BaseRepository } from './base.repository';

export class ComparisonRepository extends BaseRepository {
  constructor() {
    super(getPrisma());
  }

  findById(organizationId: string, id: string) {
    return this.prisma.comparison.findFirst({
      where: { id, organizationId },
      include: {
        job: { select: { id: true, title: true } },
        candidates: {
          include: {
            candidate: { select: { id: true, fullName: true, email: true } },
          },
        },
      },
    });
  }

  create(data: Prisma.ComparisonCreateInput) {
    return this.prisma.comparison.create({ data });
  }

  update(id: string, data: Prisma.ComparisonUpdateInput) {
    return this.prisma.comparison.update({ where: { id }, data });
  }

  updateStatus(id: string, status: ComparisonStatus, extra?: Prisma.ComparisonUpdateInput) {
    return this.prisma.comparison.update({
      where: { id },
      data: { status, ...extra },
    });
  }

  linkCandidates(comparisonId: string, candidateIds: string[]) {
    return this.prisma.comparisonCandidate.createMany({
      data: candidateIds.map((candidateId) => ({ comparisonId, candidateId })),
      skipDuplicates: true,
    });
  }
}
