import type { Prisma } from '@prisma/client';
import { getPrisma } from '../config/prisma';
import { BaseRepository } from './base.repository';

export class AuditLogRepository extends BaseRepository {
  constructor() {
    super(getPrisma());
  }

  create(data: Prisma.AuditLogCreateInput) {
    return this.prisma.auditLog.create({ data });
  }
}
