import { appendRandomSuffix, slugify } from '../../src/utils/slug';

describe('slugify', () => {
  it('normalizes organization names', () => {
    expect(slugify('Acme Corp!')).toBe('acme-corp');
  });

  it('appends suffix', () => {
    const result = appendRandomSuffix('acme');
    expect(result.startsWith('acme-')).toBe(true);
  });
});
