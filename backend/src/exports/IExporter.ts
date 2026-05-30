export interface ExportColumn {
  header: string;
  key: string;
}

export interface ExportSheet {
  name: string;
  columns: ExportColumn[];
  rows: Record<string, unknown>[];
}

export interface IExporter {
  readonly format: 'csv' | 'excel' | 'pdf';
  generate(sheets: ExportSheet[]): Promise<Buffer>;
}
