import { ExportFormat, Role } from '@prisma/client';
import type { Request, Response } from 'express';
import { exportService } from '../services/export.service';
import { asyncHandler } from '../utils/asyncHandler';
import { ok } from '../utils/ApiResponse';

async function createExportForFormat(format: ExportFormat, req: Request, res: Response) {
  const record = await exportService.create(req.user!.organizationId, req.user!.id, {
    format,
    resourceType: req.body.resourceType,
    filters: req.body.filters,
  });
  res.status(202).json(ok({ export: record }));
}

export const exportCsv = asyncHandler(async (req: Request, res: Response) => {
  await createExportForFormat(ExportFormat.CSV, req, res);
});

export const exportExcel = asyncHandler(async (req: Request, res: Response) => {
  await createExportForFormat(ExportFormat.EXCEL, req, res);
});

export const exportPdf = asyncHandler(async (req: Request, res: Response) => {
  await createExportForFormat(ExportFormat.PDF, req, res);
});

export const getExport = asyncHandler(async (req: Request, res: Response) => {
  const exportRecord = await exportService.getById(
    req.user!.organizationId,
    String(req.params.id),
  );
  res.json(ok({ export: exportRecord }));
});

export const listExports = asyncHandler(async (req: Request, res: Response) => {
  const result = await exportService.list(req.user!.organizationId, req.query);
  res.json(ok(result.items, result.meta));
});

export const exportWriteRoles = [Role.ADMIN, Role.RECRUITER, Role.HIRING_MANAGER] as const;
