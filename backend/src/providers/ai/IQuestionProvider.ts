import type { QuestionGenerationInput, QuestionGenerationOutput } from '../../types/ai.types';

export interface IQuestionProvider {
  readonly name: string;
  generate(input: QuestionGenerationInput): Promise<QuestionGenerationOutput>;
}
