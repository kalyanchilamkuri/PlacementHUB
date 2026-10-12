'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireStudent, verifySession } from '@/lib/dal';
import { checkEligibility } from '@/lib/eligibility';
import { hashPassword, verifyPassword } from '@/lib/password';
import { passwordProblem } from '@/lib/password-rules';
import type { ActionResult } from './admin';

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const num = (f: FormData, k: string) => {
  const v = str(f, k);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * Applying is re-checked on the server: eligibility, that the drive is open,
 * and that the deadline has not passed. The disabled button in the UI is not
 * the control.
 */
export async function applyToDrive(driveId: string): Promise<ActionResult> {
  const { student } = await requireStudent();

  const drive = await db.drive.findUnique({ where: { id: driveId } });
  if (!drive || drive.status !== 'PUBLISHED') return { ok: false, error: 'This drive is not open.' };
  if (drive.deadline.getTime() < Date.now())
    return { ok: false, error: 'Applications for this drive have closed.' };

  const check = checkEligibility(drive, student);
  if (!check.eligible) return { ok: false, error: check.reason };

  const existing = await db.application.findUnique({
    where: { driveId_studentId: { driveId, studentId: student.id } },
  });
  if (existing) return { ok: false, error: 'You have already applied to this drive.' };

  await db.application.create({ data: { driveId, studentId: student.id, stage: 'APPLIED' } });

  revalidatePath('/applications');
  revalidatePath('/dashboard');
  revalidatePath(`/drives/${driveId}`);
  return { ok: true };
}

export async function withdrawApplication(driveId: string): Promise<ActionResult> {
  const { student } = await requireStudent();

  const drive = await db.drive.findUnique({ where: { id: driveId } });
  if (!drive) return { ok: false, error: 'That drive no longer exists.' };
  if (drive.deadline.getTime() < Date.now())
    return { ok: false, error: 'The deadline has passed, so this can no longer be withdrawn.' };

  // Scoped to this student's own row: one student can never touch another's.
  await db.application.deleteMany({ where: { driveId, studentId: student.id } });

  revalidatePath('/applications');
  revalidatePath('/dashboard');
  revalidatePath(`/drives/${driveId}`);
  return { ok: true };
}

export async function changeMyPassword(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const session = await verifySession();

  const current = String(formData.get('current') ?? '');
  const next = String(formData.get('next') ?? '');

  const problem = passwordProblem(next);
  if (problem) return { ok: false, error: problem };
  if (next !== String(formData.get('confirm') ?? ''))
    return { ok: false, error: 'The two new passwords do not match.' };

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) return { ok: false, error: 'Account not found.' };
  if (!(await verifyPassword(current, user.passwordHash)))
    return { ok: false, error: 'Your current password is wrong.' };

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next), mustChangePassword: false },
  });

  revalidatePath('/profile');
  return { ok: true };
}

export async function updateMyProfile(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const { student } = await requireStudent();

  const cgpa = num(formData, 'cgpa');
  if (cgpa !== null && (cgpa < 0 || cgpa > 10))
    return { ok: false, error: 'CGPA has to be between 0 and 10.' };

  const batch = num(formData, 'batch');
  if (batch !== null && (batch < 2000 || batch > 2100))
    return { ok: false, error: 'That graduation year does not look right.' };

  const linkedinUrl = str(formData, 'linkedinUrl');
  if (linkedinUrl && !/^https?:\/\/[^\s]+$/i.test(linkedinUrl))
    return { ok: false, error: 'The LinkedIn link has to start with https://.' };
  const skills = str(formData, 'skills')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 15)
    .join(', ');

  // Verified academics are locked; the cell changes them after a correction request.
  const academics = student.verified
    ? {}
    : {
        cgpa,
        tenthPct: num(formData, 'tenthPct'),
        twelfthPct: num(formData, 'twelfthPct'),
        activeBacklogs: num(formData, 'activeBacklogs') ?? 0,
      };

  await db.student.update({
    where: { id: student.id },
    data: {
      rollNo: str(formData, 'rollNo') || null,
      branchCode: str(formData, 'branchCode') || null,
      batch,
      phone: str(formData, 'phone') || null,
      resumeUrl: str(formData, 'resumeUrl') || null,
      resumeLabel: str(formData, 'resumeLabel') || null,
      skills: skills || null,
      linkedinUrl: linkedinUrl || null,
      ...academics,
    },
  });

  revalidatePath('/profile');
  revalidatePath('/dashboard');
  revalidatePath('/drives');
  return { ok: true };
}
