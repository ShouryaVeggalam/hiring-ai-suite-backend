import type { InterviewQuestion } from '../types/ai.types';

export interface QuestionSetExportPayload {
  id: string;
  technical: InterviewQuestion[];
  behavioral: InterviewQuestion[];
  skillGap: InterviewQuestion[];
  followUps: InterviewQuestion[];
  exportedAt: string;
}

export function questionSetToJson(payload: QuestionSetExportPayload): Buffer {
  return Buffer.from(JSON.stringify(payload, null, 2), 'utf-8');
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function questionSetToCsv(payload: QuestionSetExportPayload): Buffer {
  const rows: string[] = ['category,difficulty,topic,question,followUps'];

  const append = (category: string, items: InterviewQuestion[]) => {
    for (const item of items) {
      rows.push(
        [
          escapeCsv(category),
          escapeCsv(item.difficulty ?? ''),
          escapeCsv(item.topic ?? ''),
          escapeCsv(item.question),
          escapeCsv((item.followUps ?? []).join(' | ')),
        ].join(','),
      );
    }
  };

  append('technical', payload.technical);
  append('behavioral', payload.behavioral);
  append('skillGap', payload.skillGap);
  append('followUps', payload.followUps);

  return Buffer.from(rows.join('\n'), 'utf-8');
}
