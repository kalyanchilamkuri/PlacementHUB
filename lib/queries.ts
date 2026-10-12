import 'server-only';
import { db } from './db';
import { checkEligibility, type Candidate, type Eligibility } from './eligibility';
import type { DriveCardData } from '@/components/app/DriveCard';

export type VisibleDrive = {
  drive: DriveCardData;
  eligibility: Eligibility;
  applied: boolean;
};

/**
 * Published drives with this student's eligibility already worked out. Every
 * student view goes through here, so the dashboard, the drives list and the
 * calendar can never disagree about who can apply to what.
 */
export async function visibleDrives(student: Candidate & { id: string }): Promise<VisibleDrive[]> {
  const [drives, applications] = await Promise.all([
    db.drive.findMany({
      where: { status: { in: ['PUBLISHED', 'CLOSED', 'IN_PROGRESS'] } },
      include: { company: { select: { name: true } } },
      orderBy: { deadline: 'asc' },
    }),
    db.application.findMany({
      where: { studentId: student.id },
      select: { driveId: true },
    }),
  ]);

  const applied = new Set(applications.map((a) => a.driveId));

  return drives.map((d) => ({
    drive: {
      id: d.id,
      role: d.role,
      type: d.type,
      ctc: d.ctc,
      minCgpa: d.minCgpa,
      locations: d.locations,
      deadline: d.deadline.toISOString(),
      company: { name: d.company.name },
    },
    eligibility: checkEligibility(d, student),
    applied: applied.has(d.id),
  }));
}

/** Drives the student may still apply to: eligible, open, not already applied. */
export function openToApply(list: VisibleDrive[], now = Date.now()) {
  return list.filter(
    (v) => v.eligibility.eligible && !v.applied && new Date(v.drive.deadline).getTime() > now,
  );
}
