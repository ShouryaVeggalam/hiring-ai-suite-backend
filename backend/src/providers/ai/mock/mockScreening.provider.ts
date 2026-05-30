import { Verdict } from '@prisma/client';
import type { IScreeningProvider } from '../IScreeningProvider';
import type { ScreeningInput, ScreeningOutput } from '../../../types/ai.types';

export class MockScreeningProvider implements IScreeningProvider {
  readonly name = 'mock';

  async screen(input: ScreeningInput): Promise<ScreeningOutput> {
    const resumeLower = input.resumeText.toLowerCase();
    const matched = input.jobSkills.filter((s) => resumeLower.includes(s.toLowerCase()));
    const missing = input.jobSkills.filter((s) => !resumeLower.includes(s.toLowerCase()));
    const ratio = input.jobSkills.length ? matched.length / input.jobSkills.length : 0.5;
    const matchScore = Math.round(ratio * 100);

    let verdict: Verdict = Verdict.NO_MATCH;
    if (matchScore >= 80) verdict = Verdict.STRONG_MATCH;
    else if (matchScore >= 60) verdict = Verdict.MATCH;
    else if (matchScore >= 40) verdict = Verdict.WEAK_MATCH;

    return {
      matchScore,
      skillMatch: input.jobSkills.map((skill) => ({
        skill,
        matched: matched.includes(skill),
        weight: 1,
      })),
      missingSkills: missing,
      strengths: matched.length ? [`Strong overlap in: ${matched.join(', ')}`] : ['Relevant experience noted'],
      weaknesses: missing.length ? [`Missing: ${missing.join(', ')}`] : [],
      confidence: 0.75,
      verdict,
      explanation: `Mock screening: ${matchScore}% skill overlap for the provided job description.`,
      modelName: 'mock-v1',
      tokensUsed: 0,
    };
  }
}
