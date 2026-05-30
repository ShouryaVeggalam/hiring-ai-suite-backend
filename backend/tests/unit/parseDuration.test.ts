import { parseDurationToMs } from '../../src/utils/parseDuration';

describe('parseDurationToMs', () => {
  it('parses minutes', () => {
    expect(parseDurationToMs('15m')).toBe(900_000);
  });

  it('parses days', () => {
    expect(parseDurationToMs('7d')).toBe(7 * 86_400_000);
  });

  it('throws on invalid format', () => {
    expect(() => parseDurationToMs('invalid')).toThrow();
  });
});
