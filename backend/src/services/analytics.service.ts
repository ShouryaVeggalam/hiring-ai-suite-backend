import { ScreeningStatus } from '@prisma/client';
import { getPrisma } from '../config/prisma';
import { usageService } from './usage.service';

const prisma = getPrisma();

function currentPeriod() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export class AnalyticsService {
  async getOverview(organizationId: string) {
    const [
      totalResumes,
      totalScreenings,
      completedScreenings,
      failedScreenings,
      avgProcessing,
      usage,
    ] = await Promise.all([
      prisma.resume.count({ where: { organizationId, deletedAt: null } }),
      prisma.screening.count({ where: { organizationId } }),
      prisma.screening.count({
        where: { organizationId, status: ScreeningStatus.COMPLETED },
      }),
      prisma.screening.count({
        where: { organizationId, status: ScreeningStatus.FAILED },
      }),
      prisma.screening.aggregate({
        where: {
          organizationId,
          status: ScreeningStatus.COMPLETED,
          startedAt: { not: null },
          completedAt: { not: null },
        },
        _avg: {
          matchScore: true,
        },
      }),
      usageService.getPeriodUsage(organizationId, currentPeriod()),
    ]);

    const finished = completedScreenings + failedScreenings;
    const successRate = finished > 0 ? completedScreenings / finished : 0;

    const processingSamples = await prisma.screening.findMany({
      where: {
        organizationId,
        status: ScreeningStatus.COMPLETED,
        startedAt: { not: null },
        completedAt: { not: null },
      },
      select: { startedAt: true, completedAt: true },
      take: 500,
      orderBy: { completedAt: 'desc' },
    });

    const avgProcessingTimeMs =
      processingSamples.length > 0
        ? processingSamples.reduce((sum, s) => {
            return sum + (s.completedAt!.getTime() - s.startedAt!.getTime());
          }, 0) / processingSamples.length
        : 0;

    return {
      totals: {
        uploads: totalResumes,
        screenings: totalScreenings,
        completedScreenings,
        failedScreenings,
      },
      successRate: Math.round(successRate * 1000) / 1000,
      avgMatchScore: avgProcessing._avg.matchScore ?? null,
      avgProcessingTimeMs: Math.round(avgProcessingTimeMs),
      usage,
      period: currentPeriod(),
    };
  }

  async getUsage(organizationId: string, period?: string) {
    const targetPeriod = period ?? currentPeriod();
    const usage = await usageService.getPeriodUsage(organizationId, targetPeriod);

    const exports = await prisma.export.count({
      where: {
        organizationId,
        createdAt: {
          gte: new Date(`${targetPeriod}-01T00:00:00.000Z`),
        },
      },
    });

    return {
      period: targetPeriod,
      metrics: usage,
      exportsInPeriod: exports,
    };
  }

  async getJobAnalytics(organizationId: string) {
    const jobs = await prisma.job.findMany({
      where: { organizationId, deletedAt: null },
      select: {
        id: true,
        title: true,
        status: true,
        screenings: {
          select: {
            status: true,
            matchScore: true,
            verdict: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return jobs.map((job) => {
      const completed = job.screenings.filter((s) => s.status === ScreeningStatus.COMPLETED);
      const scores = completed.map((s) => s.matchScore).filter((s): s is number => s != null);
      const avgScore =
        scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

      return {
        jobId: job.id,
        title: job.title,
        status: job.status,
        screeningCount: job.screenings.length,
        completedCount: completed.length,
        avgMatchScore: avgScore != null ? Math.round(avgScore * 10) / 10 : null,
      };
    });
  }
}

export const analyticsService = new AnalyticsService();
