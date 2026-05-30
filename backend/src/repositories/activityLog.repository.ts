import type { Prisma } from '@prisma/client';
import { getPrisma } from '../config/prisma';
import { BaseRepository } from './base.repository';

export class ActivityLogRepository extends BaseRepository {
  constructor() {
    super(getPrisma());
  }

  create(data: Prisma.ActivityLogCreateInput) {
    return this.prisma.activityLog.create({ data });
  }
}
