import type { Prisma } from '@prisma/client';
import { getPrisma } from '../config/prisma';
import { BaseRepository } from './base.repository';

export class ScreeningResultRepository extends BaseRepository {
  constructor() {
    super(getPrisma());
  }

  create(data: Prisma.ScreeningResultCreateInput) {
    return this.prisma.screeningResult.create({ data });
  }
}
