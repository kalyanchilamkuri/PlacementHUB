import 'server-only';
import { db } from '@/lib/db';
import { YEAR_OFFER_TYPES, offerTypeOf, type OfferType } from '@/lib/types';

/** One placed student at one company: the flat row every view is built from. */
export type PlacementRow = {
  offerId: string;
  studentId: string;
  name: string;
  email: string;
  rollNo: string | null;
  branchCode: string | null;
  batch: number | null;
  cgpa: number | null;
  skills: string[];
  linkedinUrl: string | null;
  company: string;
  companyId: string;
  role: string;
  offerType: OfferType;
  convertedFrom: OfferType | null;
  ctc: number;
  stipend: number | null;
  isOnCampus: boolean;
  academicYear: string | null;
  yearOfStudy: 3 | 4;
  offeredOn: string;
};

export type PlacementFilter = {
  academicYear?: string;
  yearOfStudy?: 3 | 4;
  offerType?: OfferType;
  branchCode?: string;
  batch?: number;
  company?: string;
};

function yearFor(offerType: OfferType, driveYear: number | null): 3 | 4 {
  if (driveYear === 3 || driveYear === 4) return driveYear;
  return YEAR_OFFER_TYPES[3].includes(offerType) ? 3 : 4;
}

export async function getPlacementRows(f: PlacementFilter = {}): Promise<PlacementRow[]> {
  const offers = await db.offer.findMany({
    where: {
      ...(f.offerType && { offerType: f.offerType }),
      ...((f.branchCode || f.batch) && {
        student: {
          ...(f.branchCode && { branchCode: f.branchCode }),
          ...(f.batch && { batch: f.batch }),
        },
      }),
      drive: {
        ...(f.academicYear && { academicYear: f.academicYear }),
        ...(f.company && { company: { name: { contains: f.company } } }),
      },
    },
    orderBy: { offeredOn: 'desc' },
    include: {
      student: { include: { user: { select: { name: true, email: true } } } },
      drive: { include: { company: { select: { id: true, name: true } } } },
    },
  });

  const rows = offers.map<PlacementRow>((o) => {
    const offerType = offerTypeOf(o.offerType);
    return {
      offerId: o.id,
      studentId: o.studentId,
      name: o.student.user.name ?? o.student.rollNo ?? 'Unnamed',
      email: o.student.user.email,
      rollNo: o.student.rollNo,
      branchCode: o.student.branchCode,
      batch: o.student.batch,
      cgpa: o.student.cgpa,
      skills: (o.student.skills ?? '').split(',').map((s) => s.trim()).filter(Boolean),
      linkedinUrl: o.student.linkedinUrl,
      company: o.drive.company.name,
      companyId: o.drive.company.id,
      role: o.drive.role,
      offerType,
      convertedFrom: o.convertedFrom ? offerTypeOf(o.convertedFrom) : null,
      ctc: o.ctc,
      stipend: o.stipend,
      isOnCampus: o.isOnCampus,
      academicYear: o.drive.academicYear,
      yearOfStudy: yearFor(offerType, o.drive.yearOfStudy),
      offeredOn: o.offeredOn.toISOString(),
    };
  });

  return f.yearOfStudy ? rows.filter((r) => r.yearOfStudy === f.yearOfStudy) : rows;
}

/** Newest first, with the season the cell is most likely looking at on top. */
export async function getSeasons(): Promise<string[]> {
  const rows = await db.drive.findMany({
    where: { academicYear: { not: null } },
    distinct: ['academicYear'],
    select: { academicYear: true },
  });
  return rows
    .map((r) => r.academicYear!)
    .sort()
    .reverse();
}

export async function getTimeline(limit = 12) {
  const events = await db.timelineEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { drive: { select: { company: { select: { name: true } } } } },
  });
  return events.map((e) => ({
    id: e.id,
    type: e.type,
    message: e.message,
    ctc: e.ctc,
    offerType: e.offerType,
    company: e.drive?.company.name ?? null,
    at: e.createdAt.toISOString(),
  }));
}

export type StudentStatus = {
  studentId: string;
  name: string;
  email: string;
  rollNo: string | null;
  branchCode: string | null;
  batch: number | null;
  cgpa: number | null;
  verified: boolean;
  skills: string[];
  linkedinUrl: string | null;
  offers: { company: string; role: string; offerType: OfferType; convertedFrom: OfferType | null; ctc: number; stipend: number | null; isOnCampus: boolean }[];
  applications: { company: string; role: string; stage: string }[];
};

/** Everyone with their offers and applications. Placed = at least one offer. */
export async function getStudentStatuses(): Promise<StudentStatus[]> {
  const students = await db.student.findMany({
    orderBy: [{ branchCode: 'asc' }, { rollNo: 'asc' }],
    include: {
      user: { select: { name: true, email: true } },
      offers: { include: { drive: { include: { company: { select: { name: true } } } } } },
      applications: {
        where: { drive: { type: { not: 'Off-campus' } } },
        include: { drive: { include: { company: { select: { name: true } } } } },
      },
    },
  });
  return students.map((s) => ({
    studentId: s.id,
    name: s.user.name ?? s.user.email,
    email: s.user.email,
    rollNo: s.rollNo,
    branchCode: s.branchCode,
    batch: s.batch,
    cgpa: s.cgpa,
    verified: s.verified,
    skills: (s.skills ?? '').split(',').map((x) => x.trim()).filter(Boolean),
    linkedinUrl: s.linkedinUrl,
    offers: s.offers.map((o) => ({
      company: o.drive.company.name,
      role: o.drive.role,
      offerType: offerTypeOf(o.offerType),
      convertedFrom: o.convertedFrom ? offerTypeOf(o.convertedFrom) : null,
      ctc: o.ctc,
      stipend: o.stipend,
      isOnCampus: o.isOnCampus,
    })),
    applications: s.applications.map((a) => ({
      company: a.drive.company.name,
      role: a.drive.role,
      stage: a.stage,
    })),
  }));
}
