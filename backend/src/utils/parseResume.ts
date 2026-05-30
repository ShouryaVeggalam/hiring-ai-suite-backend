import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

const PDF_MIME = 'application/pdf';
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export async function extractTextFromResume(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === PDF_MIME) {
    const parsed = await pdfParse(buffer);
    return parsed.text?.trim() ?? '';
  }

  if (mimeType === DOCX_MIME) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value?.trim() ?? '';
  }

  throw new Error(`Unsupported mime type for parsing: ${mimeType}`);
}

export function buildParsedData(text: string): Record<string, unknown> {
  const emailMatches = text.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g) ?? [];
  const phoneMatches = text.match(/(\+?\d[\d\s().-]{7,}\d)/g) ?? [];

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return {
    emails: [...new Set(emailMatches)],
    phones: [...new Set(phoneMatches)].slice(0, 5),
    lineCount: lines.length,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    preview: lines.slice(0, 5),
  };
}
