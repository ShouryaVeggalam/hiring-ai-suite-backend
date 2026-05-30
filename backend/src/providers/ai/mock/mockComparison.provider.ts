import type { IComparisonProvider } from '../IComparisonProvider';
import type { ComparisonInput, ComparisonOutput } from '../../../types/ai.types';

export class MockComparisonProvider implements IComparisonProvider {
  readonly name = 'mock';

  async compare(input: ComparisonInput): Promise<ComparisonOutput> {
    const ranked = [...input.candidates].sort(
      (a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0),
    );
    const winner = ranked[0]!;

    const scoreComparison: Record<string, unknown> = {};
    const skillComparison: Record<string, unknown> = {};

    for (const c of input.candidates) {
      scoreComparison[c.candidateId] = {
        fullName: c.fullName,
        matchScore: c.matchScore ?? null,
      };
      skillComparison[c.candidateId] = {
        fullName: c.fullName,
        summary: c.resumeText
          ? `Resume length ${c.resumeText.length} chars`
          : 'No resume text',
      };
    }

    const names = ranked.map((c) => c.fullName).join(', ');

    return {
      winnerCandidateId: winner.candidateId,
      reasoning: `Mock comparison ranked candidates by match score. Order: ${names}. Winner: ${winner.fullName} with score ${winner.matchScore ?? 'N/A'}.`,
      recommendation: `Proceed with ${winner.fullName} for the next interview round. Review other candidates (${ranked.slice(1).map((c) => c.fullName).join(', ') || 'none'}) as backups.`,
      skillComparison,
      scoreComparison,
      modelName: 'mock-comparison-v1',
      tokensUsed: 0,
    };
  }
}
