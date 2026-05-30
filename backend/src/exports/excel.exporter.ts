import ExcelJS from 'exceljs';
import type { ExportSheet, IExporter } from './IExporter';

export class ExcelExporter implements IExporter {
  readonly format = 'excel' as const;

  async generate(sheets: ExportSheet[]): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    for (const sheet of sheets) {
      const worksheet = workbook.addWorksheet(sheet.name.slice(0, 31));
      worksheet.columns = sheet.columns.map((c) => ({
        header: c.header,
        key: c.key,
        width: Math.min(40, Math.max(12, c.header.length + 4)),
      }));
      for (const row of sheet.rows) {
        worksheet.addRow(row);
      }
      worksheet.getRow(1).font = { bold: true };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
