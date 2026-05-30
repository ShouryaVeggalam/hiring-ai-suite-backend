import type { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { AuditLogRepository } from '../repositories/auditLog.repository';
import { getRequestMeta } from '../utils/requestMeta';

export class AuditService {
  constructor(private readonly auditLogRepo = new AuditLogRepository()) {}

  async log(
    action: string,
    options: {
      organizationId: string;
      userId?: string;
      success?: boolean;
      metadata?: Record<string, unknown>;
      req?: Request;
    },
  ) {
    const meta = options.req ? getRequestMeta(options.req) : { ip: undefined, userAgent: undefined };

    await this.auditLogRepo.create({
      action,
      success: options.success ?? true,
      metadata: options.metadata as Prisma.InputJsonValue | undefined,
      ip: meta.ip,
      userAgent: meta.userAgent,
      organization: { connect: { id: options.organizationId } },
      ...(options.userId ? { user: { connect: { id: options.userId } } } : {}),
    });
  }
}

export const auditService = new AuditService();
