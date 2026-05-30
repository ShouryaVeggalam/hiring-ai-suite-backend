import { getPrisma } from '../config/prisma';
import { BaseRepository } from './base.repository';

export class UsageRepository extends BaseRepository {
  constructor() {
    super(getPrisma());
  }

  private currentPeriod() {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  async increment(organizationId: string, metric: string, amount = 1) {
    const period = this.currentPeriod();
    return this.prisma.usage.upsert({
      where: {
        organizationId_period_metric: { organizationId, period, metric },
      },
      create: { organizationId, period, metric, count: amount },
      update: { count: { increment: amount } },
    });
  }

  async findByOrganization(organizationId: string, period?: string) {
    return this.prisma.usage.findMany({
      where: {
        organizationId,
        ...(period ? { period } : {}),
      },
      orderBy: { metric: 'asc' },
    });
  }
}
