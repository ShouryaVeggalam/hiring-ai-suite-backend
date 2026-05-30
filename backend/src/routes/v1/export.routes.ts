import { Router } from 'express';
import {
  exportCsv,
  exportExcel,
  exportPdf,
  exportWriteRoles,
  getExport,
  listExports,
} from '../../controllers/export.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleMiddleware } from '../../middleware/role.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createExportSchema, exportIdParamSchema } from '../../validators/export.validator';

const router = Router();

router.use(authMiddleware);

router.get('/export/history', listExports);

router.post(
  '/export/csv',
  roleMiddleware(...exportWriteRoles),
  validate(createExportSchema),
  exportCsv,
);

router.post(
  '/export/excel',
  roleMiddleware(...exportWriteRoles),
  validate(createExportSchema),
  exportExcel,
);

router.post(
  '/export/pdf',
  roleMiddleware(...exportWriteRoles),
  validate(createExportSchema),
  exportPdf,
);

router.get('/export/:id', validate(exportIdParamSchema, 'params'), getExport);

export default router;
