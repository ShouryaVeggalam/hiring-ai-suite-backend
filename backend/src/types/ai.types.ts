import type { Verdict } from '@prisma/client';

export interface SkillMatchItem {
  skill: string;
  matched: boolean;
  weight?: number;
}

export interface ScreeningInput {
  jobDescription: string;
  jobSkills: string[];
  resumeText: string;
  parsedData?: Record<string, unknown>;
}

export interface ScreeningOutput {
  matchScore: number;
  skillMatch: SkillMatchItem[];
  missingSkills: string[];
  strengths: string[];
  weaknesses: string[];
  confidence: number;
  verdict: Verdict;
  explanation: string;
  tokensUsed?: number;
  modelName?: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
  rationale?: string;
  followUps?: string[];
}

export interface QuestionGenerationInput {
  jobTitle?: string;
  jobDescription: string;
  resumeText?: string;
  skills?: string[];
  missingSkills?: string[];
}

export interface QuestionGenerationOutput {
  technical: InterviewQuestion[];
  behavioral: InterviewQuestion[];
  skillGap: InterviewQuestion[];
  followUps: InterviewQuestion[];
  modelName?: string;
  tokensUsed?: number;
}

export interface ComparisonInput {
  jobDescription?: string;
  candidates: Array<{
    candidateId: string;
    fullName: string;
    resumeText?: string;
    matchScore?: number;
  }>;
}

export interface ComparisonOutput {
  winnerCandidateId: string;
  reasoning: string;
  recommendation: string;
  skillComparison: Record<string, unknown>;
  scoreComparison: Record<string, unknown>;
  modelName?: string;
  tokensUsed?: number;
}
