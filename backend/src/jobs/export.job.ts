import { ExportFormat, ExportStatus } from '@prisma/client';
import type { Job } from 'bullmq';
import { getLogger } from '../config/logger';
import { getPrisma } from '../config/prisma';
import { createExporter } from '../exports/exporter.factory';
import { buildExportSheets, type ExportFilters, type ExportResourceType } from '../services/exportData.service';
import { notificationService } from '../services/notification.service';
import { createStorage } from '../storage/storage.factory';
import type { ExportJobData } from '../types/queue.types';

const logger = getLogger();
const prisma = getPrisma();
const storage = createStorage();

const EXT: Record<string, string> = {
  [ExportFormat.CSV]: 'csv',
  [ExportFormat.EXCEL]: 'xlsx',
  [ExportFormat.PDF]: 'pdf',
};

const MIME: Record<string, string> = {
  [ExportFormat.CSV]: 'text/csv',
  [ExportFormat.EXCEL]: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  [ExportFormat.PDF]: 'application/pdf',
};

export async function processExportJob(job: Job<ExportJobData>) {
  const { exportId, organizationId } = job.data;
  logger.info({ exportId, jobId: job.id }, 'Processing export');

  const record = await prisma.export.findFirst({
    where: { id: exportId, organizationId },
  });

  if (!record) {
    throw new Error(`Export not found: ${exportId}`);
  }

  await prisma.export.update({
    where: { id: exportId },
    data: { status: ExportStatus.PROCESSING },
  });

  try {
    const filters = (record.filters ?? {}) as ExportFilters;
    const resourceType = record.resourceType as ExportResourceType;
    const sheets = await buildExportSheets(organizationId, resourceType, filters);
    const exporter = createExporter(record.format);
    const buffer = await exporter.generate(sheets);

    const ext = EXT[record.format] ?? 'bin';
    const fileName = `export-${resourceType}-${exportId}.${ext}`;
    const storageKey = `${organizationId}/exports/${fileName}`;

    const stored = await storage.upload({
      key: storageKey,
      body: buffer,
      contentType: MIME[record.format] ?? 'application/octet-stream',
    });

    await prisma.export.update({
      where: { id: exportId },
      data: {
        status: ExportStatus.COMPLETED,
        storageKey: stored.key,
        fileName,
        sizeBytes: buffer.length,
        completedAt: new Date(),
        errorMessage: null,
      },
    });

    if (record.userId) {
      await notificationService.notify({
        organizationId,
        userId: record.userId,
        channels: ['IN_APP', 'EMAIL'],
        subject: 'Export ready',
        body: `Your ${record.format} export (${resourceType}) is ready to download.`,
        payload: { exportId, fileName },
      });
    }

    logger.info({ exportId, sizeBytes: buffer.length }, 'Export completed');
    return { exportId, fileName };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Export failed';
    await prisma.export.update({
      where: { id: exportId },
      data: { status: ExportStatus.FAILED, errorMessage: message },
    });
    throw err;
  }
}
