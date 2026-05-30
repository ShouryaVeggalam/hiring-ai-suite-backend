import type { ComparisonInput, ComparisonOutput } from '../../types/ai.types';

export interface IComparisonProvider {
  readonly name: string;
  compare(input: ComparisonInput): Promise<ComparisonOutput>;
}
