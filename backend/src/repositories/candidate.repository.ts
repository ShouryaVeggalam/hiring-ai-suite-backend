import { getPrisma } from '../config/prisma';
import { BaseRepository } from './base.repository';

export class CandidateRepository extends BaseRepository {
  constructor() {
    super(getPrisma());
  }

  findByIds(organizationId: string, ids: string[]) {
    return this.prisma.candidate.findMany({
      where: { organizationId, id: { in: ids }, deletedAt: null },
    });
  }

  findById(organizationId: string, id: string) {
    return this.prisma.candidate.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
  }
}
