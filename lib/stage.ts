import { db } from './db';
import { DRIVE_TYPE_TO_OFFER_TYPE, type Stage } from './types';
import { lpa } from './utils';

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
      student: { select: { user: { select: { name: true } } } },
      drive: {
        select: {
          ctc: true,
          type: true,
          company: { select: { name: true } },
          _count: { select: { rounds: true } },
        },
      },
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
    const ctc = application.drive.ctc ?? 0;
    const offerType = DRIVE_TYPE_TO_OFFER_TYPE[application.drive.type] ?? 'FULL_TIME';
    const existing = await db.offer.findUnique({ where: key, select: { id: true } });
    await db.offer.upsert({
      where: key,
      create: { studentId: application.studentId, driveId: application.driveId, ctc, offerType },
      // Keep an offerType the cell set by hand; only the CTC follows the drive.
      update: { ctc },
    });
    if (!existing) {
      const who = application.student.user.name ?? 'A student';
      await db.timelineEvent.create({
        data: {
          studentId: application.studentId,
          driveId: application.driveId,
          type: 'OFFER_RECORDED',
          message: `${who} placed at ${application.drive.company.name}${ctc ? ` - ${lpa(ctc)}` : ''}`,
          ctc,
          offerType,
        },
      });
    }
  } else {
    await db.offer.deleteMany({
      where: { studentId: application.studentId, driveId: application.driveId },
    });
  }

  return stage;
}
