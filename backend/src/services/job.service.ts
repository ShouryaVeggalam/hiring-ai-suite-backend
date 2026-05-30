import { JobStatus } from '@prisma/client';
import { ApiError } from '../utils/ApiError';
import { parsePagination, paginationMeta } from '../utils/pagination';
import { JobRepository } from '../repositories/job.repository';

export interface CreateJobInput {
  title: string;
  description: string;
  requirements?: string;
  responsibilities?: string;
  location?: string;
  employmentType?: string;
  seniority?: string;
  skills?: string[];
  teamId?: string;
}

export class JobService {
  constructor(private readonly jobRepo = new JobRepository()) {}

  async create(organizationId: string, input: CreateJobInput) {
    return this.jobRepo.create({
      organization: { connect: { id: organizationId } },
      title: input.title,
      description: input.description,
      requirements: input.requirements,
      responsibilities: input.responsibilities,
      location: input.location,
      employmentType: input.employmentType,
      seniority: input.seniority,
      skills: input.skills ?? [],
      status: JobStatus.OPEN,
      ...(input.teamId ? { team: { connect: { id: input.teamId } } } : {}),
    });
  }

  async getById(organizationId: string, id: string) {
    const job = await this.jobRepo.findById(organizationId, id);
    if (!job) {
      throw ApiError.notFound('Job not found');
    }
    return job;
  }

  async list(
    organizationId: string,
    query: { page?: string | number; limit?: string | number; status?: JobStatus },
  ) {
    const { page, limit, skip } = parsePagination(query);
    const [items, total] = await Promise.all([
      this.jobRepo.findMany(organizationId, { skip, take: limit, status: query.status }),
      this.jobRepo.count(organizationId, query.status),
    ]);
    return { items, meta: paginationMeta(page, limit, total) };
  }
}

export const jobService = new JobService();
