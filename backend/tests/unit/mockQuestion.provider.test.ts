import { MockQuestionProvider } from '../../src/providers/ai/mock/mockQuestion.provider';

describe('MockQuestionProvider', () => {
  it('returns all question categories', async () => {
    const provider = new MockQuestionProvider();
    const output = await provider.generate({
      jobDescription: 'Senior backend engineer with Node.js and PostgreSQL.',
      skills: ['Node.js', 'PostgreSQL', 'Redis'],
      missingSkills: ['Kubernetes'],
    });

    expect(output.technical.length).toBeGreaterThan(0);
    expect(output.behavioral.length).toBeGreaterThan(0);
    expect(output.skillGap.length).toBeGreaterThan(0);
    expect(output.followUps.length).toBeGreaterThan(0);
    expect(output.technical[0]?.question).toBeTruthy();
  });
});
