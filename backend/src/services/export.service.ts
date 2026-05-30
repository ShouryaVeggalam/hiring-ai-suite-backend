import { ExportFormat, ExportStatus } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { createStorage } from '../storage/storage.factory';
import { ApiError } from '../utils/ApiError';
import { parsePagination, paginationMeta } from '../utils/pagination';
import { ExportRepository } from '../repositories/export.repository';
import { activityService } from './activity.service';
import { usageService, USAGE_METRICS } from './usage.service';
import { queueService } from './queue.service';
import type { ExportFilters, ExportResourceType } from './exportData.service';

export interface CreateExportInput {
  format: ExportFormat;
  resourceType: ExportResourceType;
  filters?: ExportFilters;
}

export class ExportService {
  constructor(
    private readonly exportRepo = new ExportRepository(),
    private readonly storage = createStorage(),
  ) {}

  async create(organizationId: string, userId: string, input: CreateExportInput) {
    const record = await this.exportRepo.create({
      organization: { connect: { id: organizationId } },
      user: { connect: { id: userId } },
      format: input.format,
      status: ExportStatus.PENDING,
      resourceType: input.resourceType,
      filters: (input.filters ?? {}) as unknown as Prisma.InputJsonValue,
    });

    await queueService.enqueueExport({
      exportId: record.id,
      organizationId,
    });

    await usageService.track(organizationId, USAGE_METRICS.EXPORTS);

    await activityService.log(organizationId, 'EXPORT_REQUESTED', {
      userId,
      entityType: 'Export',
      entityId: record.id,
      metadata: { format: input.format, resourceType: input.resourceType },
    });

    return record;
  }

  async getById(organizationId: string, id: string) {
    const record = await this.exportRepo.findById(organizationId, id);
    if (!record) {
      throw ApiError.notFound('Export not found');
    }

    let downloadUrl: string | null = null;
    if (record.status === ExportStatus.COMPLETED && record.storageKey) {
      downloadUrl = await this.storage.getSignedUrl(record.storageKey);
    }

    return { ...record, downloadUrl };
  }

  async list(
    organizationId: string,
    query: { page?: string | number; limit?: string | number },
  ) {
    const { page, limit, skip } = parsePagination(query);
    const [items, total] = await Promise.all([
      this.exportRepo.findMany(organizationId, { skip, take: limit }),
      this.exportRepo.count(organizationId),
    ]);
    return { items, meta: paginationMeta(page, limit, total) };
  }
}

export const exportService = new ExportService();
