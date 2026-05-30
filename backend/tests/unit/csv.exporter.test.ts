import { CsvExporter } from '../../src/exports/csv.exporter';

describe('CsvExporter', () => {
  it('renders header and rows', async () => {
    const exporter = new CsvExporter();
    const buffer = await exporter.generate([
      {
        name: 'Test',
        columns: [
          { header: 'Name', key: 'name' },
          { header: 'Score', key: 'score' },
        ],
        rows: [
          { name: 'Alice', score: 90 },
          { name: 'Bob', score: 80 },
        ],
      },
    ]);

    const csv = buffer.toString('utf-8');
    expect(csv).toContain('Name,Score');
    expect(csv).toContain('Alice,90');
  });
});
