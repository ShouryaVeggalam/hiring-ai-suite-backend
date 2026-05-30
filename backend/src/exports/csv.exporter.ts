import type { ExportSheet, IExporter } from './IExporter';

function escapeCsv(value: unknown): string {
  const str = value == null ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export class CsvExporter implements IExporter {
  readonly format = 'csv' as const;

  async generate(sheets: ExportSheet[]): Promise<Buffer> {
    const sheet = sheets[0];
    if (!sheet) {
      return Buffer.from('', 'utf-8');
    }

    const lines = [sheet.columns.map((c) => escapeCsv(c.header)).join(',')];
    for (const row of sheet.rows) {
      lines.push(sheet.columns.map((c) => escapeCsv(row[c.key])).join(','));
    }

    return Buffer.from(lines.join('\n'), 'utf-8');
  }
}
