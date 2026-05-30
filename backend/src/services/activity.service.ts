import { ActivityLogRepository } from '../repositories/activityLog.repository';

export class ActivityService {
  constructor(private readonly repo = new ActivityLogRepository()) {}

  async log(
    organizationId: string,
    action: string,
    options?: {
      userId?: string;
      entityType?: string;
      entityId?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    await this.repo.create({
      action,
      entityType: options?.entityType,
      entityId: options?.entityId,
      metadata: options?.metadata as object | undefined,
      organization: { connect: { id: organizationId } },
      ...(options?.userId ? { user: { connect: { id: options.userId } } } : {}),
    });
  }
}

export const activityService = new ActivityService();
