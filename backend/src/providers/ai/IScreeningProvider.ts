import type { ScreeningInput, ScreeningOutput } from '../../types/ai.types';

export interface IScreeningProvider {
  readonly name: string;
  screen(input: ScreeningInput): Promise<ScreeningOutput>;
}
