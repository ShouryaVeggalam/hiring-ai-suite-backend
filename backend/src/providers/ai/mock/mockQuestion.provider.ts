import { randomUUID } from 'crypto';
import type { IQuestionProvider } from '../IQuestionProvider';
import type {
  InterviewQuestion,
  QuestionGenerationInput,
  QuestionGenerationOutput,
} from '../../../types/ai.types';

function q(
  question: string,
  opts?: Partial<InterviewQuestion>,
): InterviewQuestion {
  return { id: randomUUID(), question, ...opts };
}

export class MockQuestionProvider implements IQuestionProvider {
  readonly name = 'mock';

  async generate(input: QuestionGenerationInput): Promise<QuestionGenerationOutput> {
    const skills = input.skills?.length ? input.skills : ['communication', 'problem-solving'];
    const gaps = input.missingSkills?.length ? input.missingSkills : skills.slice(0, 2);

    const technical = skills.slice(0, 5).map((skill) =>
      q(`Describe your experience with ${skill} in a production environment.`, {
        topic: skill,
        difficulty: 'medium',
        followUps: [`How would you debug an issue related to ${skill}?`],
      }),
    );

    const behavioral = [
      q('Tell me about a time you had to meet a tight deadline.', {
        difficulty: 'medium',
        topic: 'time-management',
      }),
      q('Describe a conflict with a teammate and how you resolved it.', {
        difficulty: 'medium',
        topic: 'collaboration',
      }),
      q('Give an example of when you received critical feedback.', {
        difficulty: 'easy',
        topic: 'growth',
      }),
    ];

    const skillGap = gaps.map((skill) =>
      q(`You have limited exposure to ${skill} — how would you ramp up in the first 30 days?`, {
        topic: skill,
        difficulty: 'hard',
        rationale: `Gap identified vs job requirements: ${skill}`,
      }),
    );

    const followUps = [
      q(`Based on the role description, what interests you most about this position?`, {
        topic: 'motivation',
      }),
      q('What questions do you have for our team?', { topic: 'closing' }),
    ];

    return {
      technical,
      behavioral,
      skillGap,
      followUps,
      modelName: 'mock-questions-v1',
      tokensUsed: 0,
    };
  }
}
