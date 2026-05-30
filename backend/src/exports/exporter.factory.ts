import { ExportFormat } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { CsvExporter } from './csv.exporter';
import { ExcelExporter } from './excel.exporter';
import type { IExporter } from './IExporter';
import { PdfExporter } from './pdf.exporter';

export function createExporter(format: ExportFormat): IExporter {
  switch (format) {
    case ExportFormat.CSV:
      return new CsvExporter();
    case ExportFormat.EXCEL:
      return new ExcelExporter();
    case ExportFormat.PDF:
      return new PdfExporter();
    default:
      throw ApiError.badRequest(`Unsupported export format: ${format}`);
  }
}
