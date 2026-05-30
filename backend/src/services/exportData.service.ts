import { QuestionSetStatus, ScreeningStatus } from '@prisma/client';
import { getPrisma } from '../config/prisma';
import type { ExportSheet } from '../exports/IExporter';
import { ApiError } from '../utils/ApiError';
import type { InterviewQuestion } from '../types/ai.types';

export type ExportResourceType = 'screenings' | 'candidates' | 'question_set' | 'batch';

export interface ExportFilters {
  jobId?: string;
  batchId?: string;
  status?: string;
  questionSetId?: string;
}

const prisma = getPrisma();

export async function buildExportSheets(
  organizationId: string,
  resourceType: ExportResourceType,
  filters: ExportFilters = {},
): Promise<ExportSheet[]> {
  switch (resourceType) {
    case 'screenings':
    case 'batch':
      return [await buildScreeningsSheet(organizationId, filters)];
    case 'candidates':
      return [await buildCandidatesSheet(organizationId)];
    case 'question_set':
      return [await buildQuestionSetSheet(organizationId, filters)];
    default:
      throw ApiError.badRequest(`Unknown resource type: ${resourceType}`);
  }
}

async function buildScreeningsSheet(
  organizationId: string,
  filters: ExportFilters,
): Promise<ExportSheet> {
  const screenings = await prisma.screening.findMany({
    where: {
      organizationId,
      ...(filters.jobId ? { jobId: filters.jobId } : {}),
      ...(filters.batchId ? { batchId: filters.batchId } : {}),
      ...(filters.status ? { status: filters.status as ScreeningStatus } : {}),
    },
    include: {
      job: { select: { title: true } },
      candidate: { select: { fullName: true, email: true } },
      result: true,
    },
    orderBy: [{ matchScore: 'desc' }, { createdAt: 'desc' }],
    take: 5000,
  });

  return {
    name: 'Screenings',
    columns: [
      { header: 'Screening ID', key: 'id' },
      { header: 'Job', key: 'jobTitle' },
      { header: 'Candidate', key: 'candidateName' },
      { header: 'Email', key: 'email' },
      { header: 'Status', key: 'status' },
      { header: 'Match Score', key: 'matchScore' },
      { header: 'Verdict', key: 'verdict' },
      { header: 'Confidence', key: 'confidence' },
      { header: 'Completed At', key: 'completedAt' },
    ],
    rows: screenings.map((s) => ({
      id: s.id,
      jobTitle: s.job?.title ?? '',
      candidateName: s.candidate?.fullName ?? '',
      email: s.candidate?.email ?? '',
      status: s.status,
      matchScore: s.matchScore ?? '',
      verdict: s.verdict ?? '',
      confidence: s.result?.confidence ?? '',
      completedAt: s.completedAt?.toISOString() ?? '',
    })),
  };
}

async function buildCandidatesSheet(organizationId: string): Promise<ExportSheet> {
  const candidates = await prisma.candidate.findMany({
    where: { organizationId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  });

  return {
    name: 'Candidates',
    columns: [
      { header: 'ID', key: 'id' },
      { header: 'Name', key: 'fullName' },
      { header: 'Email', key: 'email' },
      { header: 'Phone', key: 'phone' },
      { header: 'Location', key: 'location' },
      { header: 'Created', key: 'createdAt' },
    ],
    rows: candidates.map((c) => ({
      id: c.id,
      fullName: c.fullName,
      email: c.email ?? '',
      phone: c.phone ?? '',
      location: c.location ?? '',
      createdAt: c.createdAt.toISOString(),
    })),
  };
}

async function buildQuestionSetSheet(
  organizationId: string,
  filters: ExportFilters,
): Promise<ExportSheet> {
  if (!filters.questionSetId) {
    throw ApiError.badRequest('questionSetId filter is required for question_set exports');
  }

  const qs = await prisma.questionSet.findFirst({
    where: { id: filters.questionSetId, organizationId },
  });

  if (!qs || qs.status !== QuestionSetStatus.COMPLETED) {
    throw ApiError.badRequest('Question set not found or not completed');
  }

  const rows: Record<string, unknown>[] = [];
  const append = (category: string, items: InterviewQuestion[]) => {
    for (const item of items) {
      rows.push({
        category,
        question: item.question,
        topic: item.topic ?? '',
        difficulty: item.difficulty ?? '',
        followUps: (item.followUps ?? []).join(' | '),
      });
    }
  };

  append('technical', qs.technical as unknown as InterviewQuestion[]);
  append('behavioral', qs.behavioral as unknown as InterviewQuestion[]);
  append('skillGap', qs.skillGap as unknown as InterviewQuestion[]);
  append('followUps', qs.followUps as unknown as InterviewQuestion[]);

  return {
    name: 'Interview Questions',
    columns: [
      { header: 'Category', key: 'category' },
      { header: 'Topic', key: 'topic' },
      { header: 'Difficulty', key: 'difficulty' },
      { header: 'Question', key: 'question' },
      { header: 'Follow-ups', key: 'followUps' },
    ],
    rows,
  };
}
