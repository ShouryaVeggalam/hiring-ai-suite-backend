import { NotificationChannel, NotificationStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { getConfig } from '../config';
import { createEmailProvider } from '../providers/email/email.factory';
import { webhookProvider } from '../providers/webhook/webhook.provider';
import { NotificationRepository } from '../repositories/notification.repository';
import { UserRepository } from '../repositories/user.repository';

export type NotifyChannel = 'IN_APP' | 'EMAIL' | 'WEBHOOK';

export interface NotifyInput {
  organizationId: string;
  userId?: string;
  channels: NotifyChannel[];
  subject?: string;
  body: string;
  payload?: Record<string, unknown>;
  webhookUrl?: string;
}

export class NotificationService {
  constructor(
    private readonly notificationRepo = new NotificationRepository(),
    private readonly userRepo = new UserRepository(),
  ) {}

  async notify(input: NotifyInput) {
    const results = [];

    if (input.channels.includes('IN_APP')) {
      const notification = await this.notificationRepo.create({
        organization: { connect: { id: input.organizationId } },
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.SENT,
        subject: input.subject,
        body: input.body,
        payload: input.payload as Prisma.InputJsonValue | undefined,
        sentAt: new Date(),
        ...(input.userId ? { user: { connect: { id: input.userId } } } : {}),
      });
      results.push(notification);
    }

    if (input.channels.includes('EMAIL') && input.userId) {
      const user = await this.userRepo.findById(input.userId);
      if (user) {
        const email = createEmailProvider();
        await email.send({
          to: user.email,
          subject: input.subject ?? 'HIRING AI SUITE',
          body: input.body,
        });

        await this.notificationRepo.create({
          organization: { connect: { id: input.organizationId } },
          user: { connect: { id: input.userId } },
          channel: NotificationChannel.EMAIL,
          status: NotificationStatus.SENT,
          subject: input.subject,
          body: input.body,
          payload: input.payload as Prisma.InputJsonValue | undefined,
          sentAt: new Date(),
        });
      }
    }

    if (input.channels.includes('WEBHOOK')) {
      const config = getConfig();
      const url = input.webhookUrl ?? process.env.ORG_WEBHOOK_URL;
      if (url) {
        await webhookProvider.dispatch(url, {
          event: input.subject ?? 'notification',
          organizationId: input.organizationId,
          data: input.payload ?? { body: input.body },
        });

        await this.notificationRepo.create({
          organization: { connect: { id: input.organizationId } },
          channel: NotificationChannel.WEBHOOK,
          status: NotificationStatus.SENT,
          subject: input.subject,
          body: input.body,
          payload: input.payload as Prisma.InputJsonValue | undefined,
          sentAt: new Date(),
          ...(input.userId ? { user: { connect: { id: input.userId } } } : {}),
        });
      }
    }

    return results;
  }

  async list(organizationId: string, userId: string, query: { page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.notificationRepo.findMany(organizationId, { userId, skip, take: limit }),
      this.notificationRepo.count(organizationId, userId),
    ]);

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  }

  async markRead(organizationId: string, userId: string, notificationId: string) {
    const result = await this.notificationRepo.markRead(organizationId, notificationId, userId);
    return result.count > 0;
  }
}

export const notificationService = new NotificationService();
