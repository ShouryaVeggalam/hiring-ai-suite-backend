import type { Prisma } from '@prisma/client';
import { getPrisma } from '../config/prisma';
import { BaseRepository } from './base.repository';

export class ResumeFileRepository extends BaseRepository {
  constructor() {
    super(getPrisma());
  }

  create(data: Prisma.ResumeFileCreateInput) {
    return this.prisma.resumeFile.create({ data });
  }

  findByResumeId(resumeId: string) {
    return this.prisma.resumeFile.findUnique({ where: { resumeId } });
  }
}
