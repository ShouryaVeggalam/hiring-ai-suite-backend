import {
  comparisonQueue,
  exportQueue,
  questionGenerationQueue,
  resumeProcessingQueue,
  screeningQueue,
} from '../queues';
import type {
  ComparisonJobData,
  ExportJobData,
  QuestionGenerationJobData,
  ResumeProcessingJobData,
  ScreeningJobData,
} from '../types/queue.types';

export class QueueService {
  async enqueueResumeProcessing(data: ResumeProcessingJobData) {
    const queue = resumeProcessingQueue();
    return queue.add('parse-resume', data, {
      jobId: `resume-${data.resumeId}`,
      removeOnComplete: true,
    });
  }

  async enqueueScreening(data: ScreeningJobData) {
    const queue = screeningQueue();
    return queue.add('run-screening', data, {
      jobId: `screening-${data.screeningId}`,
      removeOnComplete: true,
    });
  }

  async enqueueQuestionGeneration(data: QuestionGenerationJobData) {
    const queue = questionGenerationQueue();
    return queue.add('generate-questions', data, {
      jobId: `questions-${data.questionSetId}`,
      removeOnComplete: true,
    });
  }

  async enqueueComparison(data: ComparisonJobData) {
    const queue = comparisonQueue();
    return queue.add('run-comparison', data, {
      jobId: `comparison-${data.comparisonId}`,
      removeOnComplete: true,
    });
  }

  async enqueueExport(data: ExportJobData) {
    const queue = exportQueue();
    return queue.add('generate-export', data, {
      jobId: `export-${data.exportId}`,
      removeOnComplete: true,
    });
  }
}

export const queueService = new QueueService();
