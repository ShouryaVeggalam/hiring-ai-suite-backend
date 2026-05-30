import PDFDocument from 'pdfkit';
import type { ExportSheet, IExporter } from './IExporter';

export class PdfExporter implements IExporter {
  readonly format = 'pdf' as const;

  async generate(sheets: ExportSheet[]): Promise<Buffer> {
    const sheet = sheets[0];
    if (!sheet) {
      return Buffer.from('', 'utf-8');
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).text(sheet.name, { underline: true });
      doc.moveDown();

      for (const row of sheet.rows.slice(0, 200)) {
        for (const col of sheet.columns) {
          doc.fontSize(9).fillColor('#666').text(`${col.header}:`, { continued: true });
          doc.fontSize(10).fillColor('#000').text(` ${String(row[col.key] ?? '')}`);
        }
        doc.moveDown(0.5);
        doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor('#ddd').stroke();
        doc.moveDown(0.5);
      }

      if (sheet.rows.length > 200) {
        doc.text(`... and ${sheet.rows.length - 200} more rows (truncated in PDF)`);
      }

      doc.end();
    });
  }
}
