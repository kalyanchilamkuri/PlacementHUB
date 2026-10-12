'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/dal';
import { lpa } from '@/lib/utils';
import { OFFER_TYPES, OFFER_TYPE_LABEL, YEAR_OFFER_TYPES, type OfferType } from '@/lib/types';

export type OfferResult = { ok: true; message: string } | { ok: false; error: string };

const base = z.object({
  rollNo: z.string().trim().min(3, 'Enter the roll number.').max(30),
  offerType: z.enum(OFFER_TYPES, { message: 'Pick an offer type.' }),
  ctcLpa: z.coerce.number().min(0, 'CTC cannot be negative.').max(500, 'That CTC looks too high.'),
  stipend: z.coerce.number().int().min(0).max(1_000_000).optional(),
});

const onCampus = base.extend({ driveId: z.string().min(1, 'Pick a drive.') });

const offCampus = base.extend({
  companyName: z.string().trim().min(2, 'Enter the company name.').max(80),
  role: z.string().trim().max(80).optional(),
  academicYear: z.string().trim().regex(/^\d{4}-\d{2}$/, 'Academic year looks like 2025-26.'),
});

const fields = (f: FormData) => Object.fromEntries([...f.entries()].map(([k, v]) => [k, String(v)]));
const firstError = (e: z.ZodError) => e.issues[0]?.message ?? 'Check the form and try again.';
const rupees = (lakhs: number) => Math.round(lakhs * 100_000);

function paths() {
  for (const p of [
    '/admin',
    '/admin/offers',
    '/admin/students',
    '/admin/analytics',
    '/placements',
    '/admin/placements',
    '/dashboard',
    '/applications',
  ])
    revalidatePath(p);
  revalidatePath('/', 'layout');
}

export async function lookupStudent(rollNo: string) {
  await requireAdmin();
  const q = rollNo.trim();
  if (q.length < 3) return null;
  const s = await db.student.findFirst({
    where: { rollNo: { equals: q } },
    include: { user: { select: { name: true, email: true } }, offers: { select: { id: true } } },
  });
  if (!s) return null;
  return {
    name: s.user.name ?? 'Unnamed',
    email: s.user.email,
    branchCode: s.branchCode,
    cgpa: s.cgpa,
    offers: s.offers.length,
  };
}

/** One transaction: the offer, the application, the notification and the feed entry. */
export async function recordOffer(_prev: unknown, formData: FormData): Promise<OfferResult> {
  await requireAdmin();
  const parsed = onCampus.safeParse(fields(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const v = parsed.data;

  const [student, drive] = await Promise.all([
    db.student.findFirst({ where: { rollNo: v.rollNo }, include: { user: true } }),
    db.drive.findUnique({ where: { id: v.driveId }, include: { company: true } }),
  ]);
  if (!student) return { ok: false, error: `No student with roll number ${v.rollNo}.` };
  if (!drive) return { ok: false, error: 'That drive no longer exists.' };

  const ctc = rupees(v.ctcLpa);
  const who = student.user.name ?? student.rollNo ?? 'A student';
  const label = OFFER_TYPE_LABEL[v.offerType];

  await db.$transaction(async (tx) => {
    await tx.application.upsert({
      where: { driveId_studentId: { driveId: drive.id, studentId: student.id } },
      create: { driveId: drive.id, studentId: student.id, stage: 'OFFER' },
      update: { stage: 'OFFER' },
    });
    await tx.offer.upsert({
      where: { studentId_driveId: { studentId: student.id, driveId: drive.id } },
      create: {
        studentId: student.id,
        driveId: drive.id,
        ctc,
        offerType: v.offerType,
        stipend: v.stipend ?? null,
        isOnCampus: true,
      },
      update: { ctc, offerType: v.offerType, stipend: v.stipend ?? null },
    });
    await tx.notification.upsert({
      where: {
        userId_dedupeKey: { userId: student.userId, dedupeKey: `offer:${student.id}:${drive.id}` },
      },
      create: {
        userId: student.userId,
        type: 'STAGE_CHANGED',
        title: `Offer from ${drive.company.name}`,
        body: `${label}${ctc ? `, ${lpa(ctc)}` : ''}. Congratulations.`,
        href: '/applications',
        dedupeKey: `offer:${student.id}:${drive.id}`,
      },
      update: {},
    });
    await tx.timelineEvent.create({
      data: {
        studentId: student.id,
        driveId: drive.id,
        type: 'OFFER_RECORDED',
        message: `${who} got a ${label.toLowerCase()} offer at ${drive.company.name}`,
        ctc,
        offerType: v.offerType,
      },
    });
  });

  paths();
  return { ok: true, message: `${who} is now recorded at ${drive.company.name}.` };
}

/** Off-campus offers hang off a hidden COMPLETED drive so every query still joins cleanly. */
export async function recordOffCampusOffer(_prev: unknown, formData: FormData): Promise<OfferResult> {
  await requireAdmin();
  const parsed = offCampus.safeParse(fields(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };
  const v = parsed.data;

  const student = await db.student.findFirst({ where: { rollNo: v.rollNo }, include: { user: true } });
  if (!student) return { ok: false, error: `No student with roll number ${v.rollNo}.` };

  const yearOfStudy: 3 | 4 = YEAR_OFFER_TYPES[3].includes(v.offerType) ? 3 : 4;
  const ctc = rupees(v.ctcLpa);
  const who = student.user.name ?? student.rollNo ?? 'A student';
  const label = OFFER_TYPE_LABEL[v.offerType];

  await db.$transaction(async (tx) => {
    const company = await tx.company.upsert({
      where: { name: v.companyName },
      create: { name: v.companyName },
      update: {},
    });
    const role = v.role || 'Off-campus';
    let drive = await tx.drive.findFirst({
      where: {
        companyId: company.id,
        type: 'Off-campus',
        academicYear: v.academicYear,
        yearOfStudy,
        role,
      },
    });
    drive ??= await tx.drive.create({
      data: {
        companyId: company.id,
        role,
        type: 'Off-campus',
        deadline: new Date(),
        status: 'COMPLETED',
        season: v.academicYear,
        academicYear: v.academicYear,
        yearOfStudy,
      },
    });
    await tx.offer.upsert({
      where: { studentId_driveId: { studentId: student.id, driveId: drive.id } },
      create: {
        studentId: student.id,
        driveId: drive.id,
        ctc,
        offerType: v.offerType,
        stipend: v.stipend ?? null,
        isOnCampus: false,
      },
      update: { ctc, offerType: v.offerType, stipend: v.stipend ?? null },
    });
    await tx.notification.upsert({
      where: {
        userId_dedupeKey: { userId: student.userId, dedupeKey: `offer:${student.id}:${drive.id}` },
      },
      create: {
        userId: student.userId,
        type: 'STAGE_CHANGED',
        title: `Off-campus offer recorded: ${company.name}`,
        body: `${label}${ctc ? `, ${lpa(ctc)}` : ''}. Congratulations.`,
        dedupeKey: `offer:${student.id}:${drive.id}`,
      },
      update: {},
    });
    await tx.timelineEvent.create({
      data: {
        studentId: student.id,
        driveId: drive.id,
        type: 'OFFER_OFFCAMPUS',
        message: `${who} got a ${label.toLowerCase()} offer at ${company.name} (off-campus)`,
        ctc,
        offerType: v.offerType,
      },
    });
  });

  paths();
  return { ok: true, message: `${who}'s off-campus offer at ${v.companyName} is recorded.` };
}

export async function convertToPPO(offerId: string, ctcLpa?: number) {
  await requireAdmin();
  const offer = await db.offer.findUnique({
    where: { id: offerId },
    include: { student: { include: { user: true } }, drive: { include: { company: true } } },
  });
  if (!offer || !['2_MONTH_INTERN', '6_MONTH_INTERN', 'WINTER_INTERN'].includes(offer.offerType)) return;
  const ctc = ctcLpa && ctcLpa > 0 ? rupees(ctcLpa) : offer.ctc;

  await db.$transaction([
    db.offer.update({ where: { id: offerId }, data: { offerType: 'PPO' satisfies OfferType, ctc, convertedFrom: offer.offerType } }),
    db.timelineEvent.create({
      data: {
        studentId: offer.studentId,
        driveId: offer.driveId,
        type: 'PPO_CONVERTED',
        message: `${offer.student.user.name ?? 'A student'} converted to a PPO at ${offer.drive.company.name}`,
        ctc,
        offerType: 'PPO',
      },
    }),
    db.notification.create({
      data: {
        userId: offer.student.userId,
        type: 'STAGE_CHANGED',
        title: `PPO from ${offer.drive.company.name}`,
        body: 'Your internship has been converted to a pre-placement offer.',
        href: '/applications',
      },
    }),
  ]);
  paths();
}

export async function deleteOffer(offerId: string) {
  await requireAdmin();
  await db.offer.delete({ where: { id: offerId } }).catch(() => null);
  paths();
}

/* ------------------------------------------------------------- bulk import */

const bulkRow = z.object({
  rollNo: z.string().trim().min(3),
  company: z.string().trim().min(2).max(80),
  offerType: z.enum(OFFER_TYPES),
  ctcLpa: z.coerce.number().min(0).max(500),
  stipend: z.coerce.number().int().min(0).max(1_000_000).optional(),
  academicYear: z.string().trim().regex(/^\d{4}-\d{2}$/),
  role: z.string().trim().max(80).optional(),
  onCampus: z.boolean(),
});

export type BulkRowResult = { line: number; ok: boolean; message: string };

export async function bulkRecordOffers(
  rows: Record<string, string>[],
): Promise<{ ok: boolean; results: BulkRowResult[] }> {
  await requireAdmin();
  const results: BulkRowResult[] = [];
  if (rows.length === 0) return { ok: false, results: [{ line: 0, ok: false, message: 'The file has no rows.' }] };
  if (rows.length > 500)
    return { ok: false, results: [{ line: 0, ok: false, message: 'Import at most 500 rows at a time.' }] };

  for (const [i, raw] of rows.entries()) {
    const line = i + 2;
    const parsed = bulkRow.safeParse({
      rollNo: raw.rollNo ?? raw.roll,
      company: raw.company,
      offerType: (raw.offerType ?? '').trim().toUpperCase().replace(/[-\s]+/g, '_'),
      ctcLpa: raw.ctcLpa || 0,
      stipend: raw.stipend ? raw.stipend : undefined,
      academicYear: raw.academicYear,
      role: raw.role || undefined,
      onCampus: !/^(no|false|off|0)/i.test((raw.onCampus ?? 'yes').trim()),
    });
    if (!parsed.success) {
      const p = parsed.error.issues[0];
      results.push({ line, ok: false, message: `${p?.path.join('.') || 'row'}: ${p?.message ?? 'invalid'}` });
      continue;
    }
    const v = parsed.data;
    const student = await db.student.findFirst({ where: { rollNo: v.rollNo }, include: { user: true } });
    if (!student) {
      results.push({ line, ok: false, message: `No student with roll number ${v.rollNo}.` });
      continue;
    }

    const yearOfStudy: 3 | 4 = YEAR_OFFER_TYPES[3].includes(v.offerType) ? 3 : 4;
    const ctc = rupees(v.ctcLpa);
    const who = student.user.name ?? v.rollNo;
    const label = OFFER_TYPE_LABEL[v.offerType];
    const role = v.role || (v.onCampus ? 'Campus hire' : 'Off-campus');
    const type = v.onCampus ? (yearOfStudy === 3 ? 'Internship' : 'Full-time') : 'Off-campus';

    try {
      await db.$transaction(async (tx) => {
        const company = await tx.company.upsert({ where: { name: v.company }, create: { name: v.company }, update: {} });
        let drive = await tx.drive.findFirst({
          where: { companyId: company.id, academicYear: v.academicYear, yearOfStudy, type: v.onCampus ? { not: 'Off-campus' } : 'Off-campus' },
        });
        drive ??= await tx.drive.create({
          data: { companyId: company.id, role, type, deadline: new Date(), status: 'COMPLETED', season: v.academicYear, academicYear: v.academicYear, yearOfStudy },
        });
        if (v.onCampus)
          await tx.application.upsert({
            where: { driveId_studentId: { driveId: drive.id, studentId: student.id } },
            create: { driveId: drive.id, studentId: student.id, stage: 'OFFER' },
            update: { stage: 'OFFER' },
          });
        const existed = await tx.offer.findUnique({
          where: { studentId_driveId: { studentId: student.id, driveId: drive.id } },
          select: { id: true },
        });
        await tx.offer.upsert({
          where: { studentId_driveId: { studentId: student.id, driveId: drive.id } },
          create: { studentId: student.id, driveId: drive.id, ctc, offerType: v.offerType, stipend: v.stipend ?? null, isOnCampus: v.onCampus },
          update: { ctc, offerType: v.offerType, stipend: v.stipend ?? null },
        });
        if (!existed) {
          await tx.notification.create({
            data: {
              userId: student.userId,
              type: 'STAGE_CHANGED',
              title: `Offer from ${company.name}`,
              body: `${label}${ctc ? `, ${lpa(ctc)}` : ''}. Congratulations.`,
              href: '/applications',
              dedupeKey: `offer:${student.id}:${drive.id}`,
            },
          });
          await tx.timelineEvent.create({
            data: {
              studentId: student.id,
              driveId: drive.id,
              type: v.onCampus ? 'OFFER_RECORDED' : 'OFFER_OFFCAMPUS',
              message: `${who} got a ${label.toLowerCase()} offer at ${company.name}${v.onCampus ? '' : ' (off-campus)'}`,
              ctc,
              offerType: v.offerType,
            },
          });
        }
      });
      results.push({ line, ok: true, message: `${who} at ${v.company}` });
    } catch {
      results.push({ line, ok: false, message: 'Could not save this row.' });
    }
  }

  paths();
  return { ok: results.some((r) => r.ok), results };
}
