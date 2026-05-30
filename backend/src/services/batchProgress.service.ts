import { BatchStatus, ScreeningStatus } from '@prisma/client';
import { getPrisma } from '../config/prisma';
import { getLogger } from '../config/logger';

const prisma = getPrisma();
const logger = getLogger();

/** Updates batch counters when a screening in a batch finishes. */
export async function recordBatchScreeningOutcome(
  batchId: string | null | undefined,
  success: boolean,
) {
  if (!batchId) return;

  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) return;

  await prisma.batch.update({
    where: { id: batchId },
    data: success ? { completedCount: { increment: 1 } } : { failedCount: { increment: 1 } },
  });

  const updated = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!updated) return;

  const processed = updated.completedCount + updated.failedCount;
  if (processed < updated.totalCount) {
    return;
  }

  let status: BatchStatus = BatchStatus.COMPLETED;
  if (updated.failedCount === updated.totalCount) {
    status = BatchStatus.FAILED;
  } else if (updated.failedCount > 0) {
    status = BatchStatus.PARTIAL;
  }

  await prisma.batch.update({
    where: { id: batchId },
    data: { status },
  });

  logger.info({ batchId, status }, 'Batch screening run finished');
}

export async function countPendingBatchScreenings(batchId: string) {
  return prisma.screening.count({
    where: {
      batchId,
      status: { in: [ScreeningStatus.PENDING, ScreeningStatus.PROCESSING] },
    },
  });
}
