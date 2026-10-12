'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/dal';
import { recomputeStage } from '@/lib/stage';
import {
  notifyDrivePublished,
  notifyNoticePublished,
  notifyStageChanged,
} from '@/lib/notify';
import { hashPassword } from '@/lib/password';
import { passwordProblem } from '@/lib/password-rules';
import { toCsv, type RoundResultValue } from '@/lib/types';

/**
 * Server actions are public endpoints. Every one of these re-checks the role —
 * the admin layout is chrome, not a guard.
 */

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const num = (f: FormData, k: string) => {
  const v = str(f, k);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
/** Packages are typed in lakhs and stored as whole rupees. */
const lpaToRupees = (lakhs: number | null) =>
  lakhs === null ? null : Math.round(lakhs * 100_000);

export type ActionResult = { ok: true } | { ok: false; error: string };

/* ------------------------------------------------------------- branches */

export async function createBranch(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const code = str(formData, 'code').toUpperCase();
  const name = str(formData, 'name');
  const programme = str(formData, 'programme');

  if (!code || !name || !programme) return { ok: false, error: 'Code, name and programme are all needed.' };
  if (await db.branch.findUnique({ where: { code } }))
    return { ok: false, error: `${code} already exists.` };

  await db.branch.create({ data: { code, name, programme } });
  revalidatePath('/admin/settings');
  revalidatePath('/admin');
  return { ok: true };
}

export async function deleteBranch(code: string) {
  await requireAdmin();
  const inUse = await db.student.count({ where: { branchCode: code } });
  if (inUse > 0) return;
  await db.branch.delete({ where: { code } });
  revalidatePath('/admin/settings');
}

/* ------------------------------------------------------------ companies */

export async function createCompany(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const name = str(formData, 'name');
  if (!name) return { ok: false, error: 'The company needs a name.' };
  if (await db.company.findUnique({ where: { name } }))
    return { ok: false, error: `${name} is already listed.` };

  await db.company.create({
    data: {
      name,
      sector: str(formData, 'sector') || null,
      website: str(formData, 'website') || null,
      hq: str(formData, 'hq') || null,
      description: str(formData, 'description') || null,
    },
  });
  revalidatePath('/admin/companies');
  revalidatePath('/admin');
  return { ok: true };
}

export async function deleteCompany(id: string) {
  await requireAdmin();
  await db.company.delete({ where: { id } });
  revalidatePath('/admin/companies');
}

/* --------------------------------------------------------------- drives */

type RoundInput = { name: string; type: string; startsAt?: string; venue?: string };

export async function createDrive(_prev: unknown, formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const companyId = str(formData, 'companyId');
  const role = str(formData, 'role');
  const deadline = str(formData, 'deadline');
  if (!companyId || !role || !deadline)
    return { ok: false, error: 'Company, role and closing date are all needed.' };

  const deadlineAt = new Date(deadline);
  if (Number.isNaN(deadlineAt.getTime())) return { ok: false, error: 'That closing date is not valid.' };

  let rounds: RoundInput[] = [];
  try {
    const raw = str(formData, 'rounds');
    if (raw) rounds = JSON.parse(raw) as RoundInput[];
  } catch {
    return { ok: false, error: 'The rounds could not be read. Remove one and add it again.' };
  }

  const branchCodes = formData.getAll('branchCodes').map(String);

  const drive = await db.drive.create({
    data: {
      companyId,
      role,
      type: str(formData, 'type') || 'Full-time',
      ctc: lpaToRupees(num(formData, 'ctcLpa')),
      stipend: num(formData, 'stipend'),
      locations: str(formData, 'locations') || null,
      jdText: str(formData, 'jdText') || null,
      deadline: deadlineAt,
      status: str(formData, 'publish') === 'yes' ? 'PUBLISHED' : 'DRAFT',
      season: str(formData, 'season') || null,
      minCgpa: num(formData, 'minCgpa') ?? 0,
      maxBacklogs: num(formData, 'maxBacklogs') ?? 0,
      minTenthPct: num(formData, 'minTenthPct'),
      minTwelfthPct: num(formData, 'minTwelfthPct'),
      branchCodes: toCsv(branchCodes),
      rounds: {
        create: rounds
          .filter((r) => r.name?.trim())
          .map((r, i) => ({
            order: i + 1,
            name: r.name.trim(),
            type: r.type || 'TECH',
            startsAt: r.startsAt ? new Date(r.startsAt) : null,
            venue: r.venue?.trim() || null,
          })),
      },
    },
  });

  if (drive.status === 'PUBLISHED') await notifyDrivePublished(drive.id);

  revalidatePath('/admin/drives');
  revalidatePath('/admin');
  redirect(`/admin/drives/${drive.id}/applicants`);
}

export async function setDriveStatus(id: string, status: string) {
  await requireAdmin();
  const before = await db.drive.findUnique({ where: { id }, select: { status: true } });
  await db.drive.update({ where: { id }, data: { status } });

  // Only on the transition into PUBLISHED, so re-saving a live drive is quiet.
  if (status === 'PUBLISHED' && before?.status !== 'PUBLISHED') {
    await notifyDrivePublished(id);
  }

  revalidatePath('/admin/drives');
  revalidatePath(`/admin/drives/${id}/applicants`);
}

export async function deleteDrive(id: string) {
  await requireAdmin();
  await db.drive.delete({ where: { id } });
  revalidatePath('/admin/drives');
  redirect('/admin/drives');
}

/* ------------------------------------------------ the toggle table */

export async function setRoundResult(
  applicationId: string,
  roundId: string,
  result: RoundResultValue,
) {
  await requireAdmin();

  await db.roundResult.upsert({
    where: { applicationId_roundId: { applicationId, roundId } },
    create: { applicationId, roundId, result },
    update: { result },
  });

  await recomputeStage(applicationId);
  await notifyStageChanged(applicationId);

  const application = await db.application.findUnique({
    where: { id: applicationId },
    select: { driveId: true },
  });
  if (application) revalidatePath(`/admin/drives/${application.driveId}/applicants`);
}

export async function setRoundResultsBulk(
  roundId: string,
  applicationIds: string[],
  result: RoundResultValue,
) {
  await requireAdmin();
  if (applicationIds.length === 0) return;

  await db.$transaction(
    applicationIds.map((applicationId) =>
      db.roundResult.upsert({
        where: { applicationId_roundId: { applicationId, roundId } },
        create: { applicationId, roundId, result },
        update: { result },
      }),
    ),
  );

  for (const id of applicationIds) {
    await recomputeStage(id);
    await notifyStageChanged(id);
  }

  const round = await db.round.findUnique({ where: { id: roundId }, select: { driveId: true } });
  if (round) revalidatePath(`/admin/drives/${round.driveId}/applicants`);
}

/* -------------------------------------------------------------- notices */

export async function createNotice(_prev: unknown, formData: FormData): Promise<ActionResult> {
  const me = await requireAdmin();

  const title = str(formData, 'title');
  const body = str(formData, 'body');
  if (!title || !body) return { ok: false, error: 'A notice needs a title and something to say.' };

  const notice = await db.notice.create({
    data: {
      title,
      body,
      priority: str(formData, 'priority') === 'URGENT' ? 'URGENT' : 'NORMAL',
      branchCodes: toCsv(formData.getAll('branchCodes').map(String)),
      createdById: me.userId,
    },
  });

  await notifyNoticePublished(notice.id);

  revalidatePath('/admin/notices');
  revalidatePath('/notices');
  return { ok: true };
}

export async function deleteNotice(id: string) {
  await requireAdmin();
  // The notifications already sent stay; deleting the notice does not unsay it.
  await db.notice.delete({ where: { id } });
  revalidatePath('/admin/notices');
  revalidatePath('/notices');
}

/* --------------------------------------------------------------- people */

export async function setStudentVerified(studentId: string, verified: boolean) {
  await requireAdmin();
  await db.student.update({ where: { id: studentId }, data: { verified } });
  revalidatePath('/admin/students');
}

/**
 * There is no email service, so a forgotten password is only recoverable by the
 * cell. The student is forced to change it the next time they sign in.
 */
export async function resetUserPassword(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();

  const userId = str(formData, 'userId');
  const password = str(formData, 'password');
  const problem = passwordProblem(password);
  if (problem) return { ok: false, error: problem };

  await db.user.update({
    where: { id: userId },
    data: { passwordHash: await hashPassword(password), mustChangePassword: true },
  });

  revalidatePath('/admin/settings');
  return { ok: true };
}

export async function setUserRole(userId: string, role: 'ADMIN' | 'STUDENT') {
  const me = await requireAdmin();
  // Removing your own admin rights would lock you out of this screen.
  if (userId === me.userId) return;

  await db.user.update({ where: { id: userId }, data: { role } });

  if (role === 'STUDENT') {
    const existing = await db.student.findUnique({ where: { userId } });
    if (!existing) await db.student.create({ data: { userId } });
  }

  revalidatePath('/admin/settings');
  revalidatePath('/admin/students');
}
