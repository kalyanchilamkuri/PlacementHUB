import 'server-only';
import { db } from '@/lib/db';
import { getPlacementRows, getStudentStatuses, getTimeline, type StudentStatus } from '@/lib/placements';
import { openToApply, visibleDrives } from '@/lib/queries';
import { OFFER_TYPES, OFFER_TYPE_LABEL, type OfferType } from '@/lib/types';
import { lpa, offerMoney } from '@/lib/utils';

export type ToolContext = { role: 'ADMIN' | 'STUDENT'; studentId: string | null };

type Args = Record<string, unknown>;
const s = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);
const n = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

const OFFER_ENUM = [...OFFER_TYPES];

/** Gemini function declarations. Descriptions are what the model routes on. */
export const TOOL_DECLARATIONS = [
  {
    name: 'get_student',
    description:
      'Full placement status of one student: profile, offers (company, type, package) and applications. Students always get their own record; admins must pass rollNo.',
    parameters: {
      type: 'OBJECT',
      properties: { rollNo: { type: 'STRING', description: 'Roll number. Admin only.' } },
    },
  },
  {
    name: 'placement_stats',
    description:
      'Aggregate numbers: students placed and unplaced, placement percentage, average, median and highest package, offer counts by type. Optional filters.',
    parameters: {
      type: 'OBJECT',
      properties: {
        academicYear: { type: 'STRING', description: 'e.g. 2025-26' },
        branchCode: { type: 'STRING', description: 'e.g. CSE' },
        yearOfStudy: { type: 'INTEGER', description: '3 for internships, 4 for winter/PPO/full-time' },
      },
    },
  },
  {
    name: 'offers_by_type',
    description:
      'List students holding a given kind of offer, such as all 6-month interns, winter interns, PPOs or full-time offers.',
    parameters: {
      type: 'OBJECT',
      properties: {
        offerType: { type: 'STRING', enum: OFFER_ENUM },
        academicYear: { type: 'STRING' },
        branchCode: { type: 'STRING' },
      },
      required: ['offerType'],
    },
  },
  {
    name: 'company_selections',
    description: 'Which students a company selected, with offer type and package. Partial company names work.',
    parameters: {
      type: 'OBJECT',
      properties: { company: { type: 'STRING' }, academicYear: { type: 'STRING' } },
      required: ['company'],
    },
  },
  {
    name: 'list_unplaced',
    description: 'Students with no offer yet. Admin only. Can filter by branch, batch and minimum CGPA.',
    parameters: {
      type: 'OBJECT',
      properties: {
        branchCode: { type: 'STRING' },
        batch: { type: 'INTEGER' },
        minCgpa: { type: 'NUMBER' },
      },
    },
  },
  {
    name: 'search_students',
    description: 'Find students by part of a name, roll number or email. Admin only.',
    parameters: {
      type: 'OBJECT',
      properties: { query: { type: 'STRING' } },
      required: ['query'],
    },
  },
  {
    name: 'eligible_drives',
    description:
      'Open drives a student can still apply to, plus why they cannot apply to others. Students get their own; admins must pass rollNo.',
    parameters: {
      type: 'OBJECT',
      properties: { rollNo: { type: 'STRING' } },
    },
  },
  {
    name: 'list_drives',
    description: 'Drives (company visits) with role, package, deadline and status.',
    parameters: {
      type: 'OBJECT',
      properties: {
        academicYear: { type: 'STRING' },
        yearOfStudy: { type: 'INTEGER' },
        status: { type: 'STRING', enum: ['PUBLISHED', 'CLOSED', 'COMPLETED', 'DRAFT'] },
      },
    },
  },
  {
    name: 'recent_placements',
    description: 'The latest placement announcements, newest first.',
    parameters: { type: 'OBJECT', properties: { limit: { type: 'INTEGER' } } },
  },
];

const median = (xs: number[]) => {
  if (xs.length === 0) return 0;
  const a = [...xs].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m]! : (a[m - 1]! + a[m]!) / 2;
};

const brief = (r: { name: string; rollNo: string | null; branchCode: string | null; company: string; role: string; offerType: OfferType; ctc: number; stipend: number | null; isOnCampus: boolean }) => ({
  name: r.name,
  rollNo: r.rollNo,
  branch: r.branchCode,
  company: r.company,
  role: r.role,
  offerType: OFFER_TYPE_LABEL[r.offerType],
  package: offerMoney(r) ?? 'not recorded',
  onCampus: r.isOnCampus,
});

function describe(st: StudentStatus) {
  return {
    name: st.name,
    rollNo: st.rollNo,
    email: st.email,
    branch: st.branchCode,
    batch: st.batch,
    cgpa: st.cgpa,
    verified: st.verified,
    placed: st.offers.length > 0,
    offers: st.offers.map((o) => ({
      company: o.company,
      role: o.role,
      offerType: OFFER_TYPE_LABEL[o.offerType],
      package: offerMoney(o) ?? 'not recorded',
      onCampus: o.isOnCampus,
    })),
    applications: st.applications,
  };
}

const MAX_ROWS = 40;
const capped = <T,>(xs: T[]) => ({ total: xs.length, shown: Math.min(xs.length, MAX_ROWS), rows: xs.slice(0, MAX_ROWS) });

export async function runTool(name: string, a: Args, ctx: ToolContext): Promise<unknown> {
  const admin = ctx.role === 'ADMIN';
  const denied = { error: 'That information is only available to the placement cell.' };

  switch (name) {
    case 'get_student': {
      const all = await getStudentStatuses();
      const hit = admin
        ? all.find((x) => x.rollNo?.toLowerCase() === s(a.rollNo)?.toLowerCase())
        : all.find((x) => x.studentId === ctx.studentId);
      if (!hit) return { error: admin ? 'No student has that roll number.' : 'Your profile was not found.' };
      return describe(hit);
    }

    case 'placement_stats': {
      const year = n(a.yearOfStudy) === 3 ? 3 : n(a.yearOfStudy) === 4 ? 4 : undefined;
      const [rows, students] = await Promise.all([
        getPlacementRows({ academicYear: s(a.academicYear), branchCode: s(a.branchCode), yearOfStudy: year }),
        getStudentStatuses(),
      ]);
      const pool = students.filter((x) => !s(a.branchCode) || x.branchCode === s(a.branchCode));
      const placedIds = new Set(rows.map((r) => r.studentId));
      const ctcs = rows.filter((r) => r.ctc > 0 && !['2_MONTH_INTERN', '6_MONTH_INTERN', 'WINTER_INTERN'].includes(r.offerType)).map((r) => r.ctc);
      const byType: Record<string, number> = {};
      for (const r of rows) byType[OFFER_TYPE_LABEL[r.offerType]] = (byType[OFFER_TYPE_LABEL[r.offerType]] ?? 0) + 1;
      return {
        studentsInScope: pool.length,
        studentsWithOffers: placedIds.size,
        studentsWithoutOffers: Math.max(0, pool.length - placedIds.size),
        placementPercent: pool.length ? Math.round((placedIds.size / pool.length) * 100) : 0,
        totalOffers: rows.length,
        offersByType: byType,
        fullTimePackages: ctcs.length
          ? { average: lpa(Math.round(ctcs.reduce((x, y) => x + y, 0) / ctcs.length)), median: lpa(median(ctcs)), highest: lpa(Math.max(...ctcs)) }
          : null,
        companies: new Set(rows.map((r) => r.company)).size,
      };
    }

    case 'offers_by_type': {
      const t = s(a.offerType) as OfferType | undefined;
      if (!t || !OFFER_TYPES.includes(t)) return { error: 'Unknown offer type.' };
      const rows = await getPlacementRows({ offerType: t, academicYear: s(a.academicYear), branchCode: s(a.branchCode) });
      return capped(rows.map(brief));
    }

    case 'company_selections': {
      const rows = await getPlacementRows({ company: s(a.company), academicYear: s(a.academicYear) });
      return capped(rows.map(brief));
    }

    case 'list_unplaced': {
      if (!admin) return denied;
      const all = await getStudentStatuses();
      const min = n(a.minCgpa);
      const list = all.filter(
        (x) =>
          x.offers.length === 0 &&
          (!s(a.branchCode) || x.branchCode === s(a.branchCode)) &&
          (!n(a.batch) || x.batch === n(a.batch)) &&
          (min === undefined || (x.cgpa ?? 0) >= min),
      );
      return capped(list.map((x) => ({ name: x.name, rollNo: x.rollNo, branch: x.branchCode, batch: x.batch, cgpa: x.cgpa, email: x.email })));
    }

    case 'search_students': {
      if (!admin) return denied;
      const q = s(a.query)?.toLowerCase();
      if (!q) return { error: 'Give me something to search for.' };
      const all = await getStudentStatuses();
      const hits = all.filter((x) => [x.name, x.rollNo, x.email].some((v) => v?.toLowerCase().includes(q)));
      return capped(hits.map(describe));
    }

    case 'eligible_drives': {
      let id = ctx.studentId;
      if (admin) {
        const roll = s(a.rollNo);
        if (!roll) return { error: 'Which roll number?' };
        id = (await db.student.findFirst({ where: { rollNo: roll }, select: { id: true } }))?.id ?? null;
      }
      if (!id) return { error: 'Student not found.' };
      const student = await db.student.findUnique({ where: { id } });
      if (!student) return { error: 'Student not found.' };
      const all = await visibleDrives(student);
      const open = openToApply(all);
      return {
        canApplyNow: open.map((v) => ({ company: v.drive.company.name, role: v.drive.role, package: v.drive.ctc ? lpa(v.drive.ctc) : null, deadline: v.drive.deadline })),
        notEligible: all
          .filter((v) => !v.eligibility.eligible)
          .slice(0, 10)
          .map((v) => ({ company: v.drive.company.name, role: v.drive.role, reason: v.eligibility.eligible ? '' : v.eligibility.reason })),
        alreadyApplied: all.filter((v) => v.applied).map((v) => `${v.drive.company.name} - ${v.drive.role}`),
      };
    }

    case 'list_drives': {
      const drives = await db.drive.findMany({
        where: {
          type: { not: 'Off-campus' },
          ...(s(a.academicYear) && { academicYear: s(a.academicYear) }),
          ...(n(a.yearOfStudy) && { yearOfStudy: n(a.yearOfStudy) }),
          ...(s(a.status) ? { status: s(a.status) } : admin ? {} : { status: { not: 'DRAFT' } }),
        },
        include: { company: { select: { name: true } }, _count: { select: { applications: true, offers: true } } },
        orderBy: { deadline: 'desc' },
        take: MAX_ROWS,
      });
      return drives.map((d) => ({
        company: d.company.name,
        role: d.role,
        type: d.type,
        package: d.ctc ? lpa(d.ctc) : null,
        deadline: d.deadline.toISOString().slice(0, 10),
        status: d.status,
        academicYear: d.academicYear,
        yearOfStudy: d.yearOfStudy,
        minCgpa: d.minCgpa,
        applicants: d._count.applications,
        offers: d._count.offers,
      }));
    }

    case 'recent_placements':
      return (await getTimeline(Math.min(n(a.limit) ?? 10, 25))).map((e) => ({ message: e.message, package: e.ctc ? lpa(e.ctc) : null, when: e.at.slice(0, 10) }));

    default:
      return { error: `Unknown tool ${name}.` };
  }
}
