import { NotificationStatus, type Prisma } from '@prisma/client';
import { getPrisma } from '../config/prisma';
import { BaseRepository } from './base.repository';

export class NotificationRepository extends BaseRepository {
  constructor() {
    super(getPrisma());
  }

  create(data: Prisma.NotificationCreateInput) {
    return this.prisma.notification.create({ data });
  }

  findMany(organizationId: string, options: { userId?: string; skip: number; take: number }) {
    return this.prisma.notification.findMany({
      where: {
        organizationId,
        ...(options.userId ? { userId: options.userId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      skip: options.skip,
      take: options.take,
    });
  }

  count(organizationId: string, userId?: string) {
    return this.prisma.notification.count({
      where: {
        organizationId,
        ...(userId ? { userId } : {}),
      },
    });
  }

  markRead(organizationId: string, id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, organizationId, userId },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
  }
}
