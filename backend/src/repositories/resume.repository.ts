import { ScreeningStatus, type Prisma } from '@prisma/client';
import { getPrisma } from '../config/prisma';
import { BaseRepository } from './base.repository';

export class ResumeRepository extends BaseRepository {
  constructor() {
    super(getPrisma());
  }

  findById(organizationId: string, id: string) {
    return this.prisma.resume.findFirst({
      where: { id, organizationId, deletedAt: null },
      include: { file: true, candidate: true },
    });
  }

  create(data: Prisma.ResumeCreateInput) {
    return this.prisma.resume.create({ data });
  }

  update(id: string, data: Prisma.ResumeUpdateInput) {
    return this.prisma.resume.update({ where: { id }, data });
  }

  updateStatus(id: string, status: ScreeningStatus, data?: Prisma.ResumeUpdateInput) {
    return this.prisma.resume.update({
      where: { id },
      data: { status, ...data },
    });
  }

  softDelete(organizationId: string, id: string) {
    return this.prisma.resume.updateMany({
      where: { id, organizationId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
