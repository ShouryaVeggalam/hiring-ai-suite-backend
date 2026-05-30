export interface ResumeProcessingJobData {
  resumeId: string;
  organizationId: string;
}

export interface ScreeningJobData {
  screeningId: string;
  organizationId: string;
}

export interface QuestionGenerationJobData {
  questionSetId: string;
  organizationId: string;
}

export interface ComparisonJobData {
  comparisonId: string;
  organizationId: string;
}

export interface ExportJobData {
  exportId: string;
  organizationId: string;
}
