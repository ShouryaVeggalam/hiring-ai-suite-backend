import { questionSetToCsv, questionSetToJson } from '../../src/exports/questionSet.exporter';

describe('questionSet exporter', () => {
  const payload = {
    id: 'qs_1',
    exportedAt: new Date().toISOString(),
    technical: [{ id: '1', question: 'Explain event loop', topic: 'node' }],
    behavioral: [{ id: '2', question: 'Tell me about conflict' }],
    skillGap: [{ id: '3', question: 'How would you learn K8s?' }],
    followUps: [{ id: '4', question: 'Questions for us?' }],
  };

  it('exports JSON', () => {
    const buf = questionSetToJson(payload);
    const parsed = JSON.parse(buf.toString('utf-8'));
    expect(parsed.id).toBe('qs_1');
  });

  it('exports CSV with header', () => {
    const csv = questionSetToCsv(payload).toString('utf-8');
    expect(csv.startsWith('category,difficulty,topic,question,followUps')).toBe(true);
    expect(csv).toContain('technical');
  });
});
