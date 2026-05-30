import { MockComparisonProvider } from '../../src/providers/ai/mock/mockComparison.provider';

describe('MockComparisonProvider', () => {
  it('picks highest match score as winner', async () => {
    const provider = new MockComparisonProvider();
    const output = await provider.compare({
      jobDescription: 'Backend engineer',
      candidates: [
        { candidateId: 'a', fullName: 'Alice', matchScore: 72 },
        { candidateId: 'b', fullName: 'Bob', matchScore: 91 },
      ],
    });

    expect(output.winnerCandidateId).toBe('b');
    expect(output.reasoning).toContain('Bob');
    expect(output.recommendation).toBeTruthy();
  });
});
