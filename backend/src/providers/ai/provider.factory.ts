import { getConfig } from '../../config';
import type { IComparisonProvider } from './IComparisonProvider';
import type { IQuestionProvider } from './IQuestionProvider';
import type { IScreeningProvider } from './IScreeningProvider';
import { MockComparisonProvider } from './mock/mockComparison.provider';
import { MockQuestionProvider } from './mock/mockQuestion.provider';
import { MockScreeningProvider } from './mock/mockScreening.provider';

export function createScreeningProvider(): IScreeningProvider {
  const config = getConfig();
  switch (config.AI_PROVIDER) {
    case 'mock':
      return new MockScreeningProvider();
    case 'openai':
      throw new Error('OpenAI screening provider not implemented yet');
    default:
      return new MockScreeningProvider();
  }
}

export function createQuestionProvider(): IQuestionProvider {
  const config = getConfig();
  switch (config.AI_PROVIDER) {
    case 'mock':
      return new MockQuestionProvider();
    case 'openai':
      throw new Error('OpenAI question provider not implemented yet');
    default:
      return new MockQuestionProvider();
  }
}

export function createComparisonProvider(): IComparisonProvider {
  const config = getConfig();
  switch (config.AI_PROVIDER) {
    case 'mock':
      return new MockComparisonProvider();
    case 'openai':
      throw new Error('OpenAI comparison provider not implemented yet');
    default:
      return new MockComparisonProvider();
  }
}
