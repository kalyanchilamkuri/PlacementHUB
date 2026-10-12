import { db } from './db';
import type { Stage } from './types';

/**
 * An application's stage is never written by hand — it is derived from the
 * round results so the cell's toggle table and the student's tracker cannot
 * disagree. Recomputed here on every result write.
 */
export function deriveStage(
  results: { result: string }[],
  roundCount: number,
): Stage {
  if (results.some((r) => r.result === 'FAIL')) return 'REJECTED';
  const passed = results.filter((r) => r.result === 'PASS').length;
  if (roundCount > 0 && passed >= roundCount) return 'OFFER';
  if (passed > 0) return 'IN_PROGRESS';
  return 'APPLIED';
}

/** How far through the rounds the student has got, for the stepper. */
export function passedCount(results: { result: string }[]) {
  return results.filter((r) => r.result === 'PASS').length;
}

export async function recomputeStage(applicationId: string) {
  const application = await db.application.findUnique({
    where: { id: applicationId },
    select: {
      studentId: true,
      driveId: true,
      results: { select: { result: true } },
      drive: { select: { ctc: true, _count: { select: { rounds: true } } } },
    },
  });
  if (!application) return;

  const stage = deriveStage(application.results, application.drive._count.rounds);
  await db.application.update({ where: { id: applicationId }, data: { stage } });

  // Clearing every round is what records the offer, so the overview figures
  // follow from the same toggles rather than a separate step someone forgets.
  const key = {
    studentId_driveId: { studentId: application.studentId, driveId: application.driveId },
  };
  if (stage === 'OFFER') {
    await db.offer.upsert({
      where: key,
      create: {
        studentId: application.studentId,
        driveId: application.driveId,
        ctc: application.drive.ctc ?? 0,
      },
      update: { ctc: application.drive.ctc ?? 0 },
    });
  } else {
    await db.offer.deleteMany({
      where: { studentId: application.studentId, driveId: application.driveId },
    });
  }

  return stage;
}
