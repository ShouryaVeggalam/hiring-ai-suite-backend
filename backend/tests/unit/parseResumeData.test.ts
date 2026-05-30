import { buildParsedData } from '../../src/utils/parseResume';

describe('buildParsedData', () => {
  it('extracts emails and word count', () => {
    const data = buildParsedData('Contact: jane@example.com\nSkills: Node.js');
    expect(data.emails).toContain('jane@example.com');
    expect(data.wordCount).toBeGreaterThan(0);
  });
});
