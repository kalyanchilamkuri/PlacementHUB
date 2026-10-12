import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, CalendarDays, ExternalLink, Rocket, Trophy, Users } from 'lucide-react';
import { requireAdmin } from '@/lib/dal';
import { db } from '@/lib/db';
import { lpa, offerMoney, shortDate } from '@/lib/utils';
import {
  GROUP_LABEL,
  OFFER_GROUPS,
  offerGroup,
  yearLabelOfBatch,
  type OfferGroup,
} from '@/lib/types';
import { CompanyMark } from '@/components/ui/kit';
import { CountUp } from '@/components/ui/CountUp';
import { VisitHistory } from './VisitHistory';

export const metadata: Metadata = { title: 'Company' };

const TINT: Record<OfferGroup, string> = {
  '2_MONTH': 'var(--o-2m)',
  '6_MONTH': 'var(--o-6m)',
  WINTER: 'var(--o-winter)',
  FULL_TIME: 'var(--o-full)',
};

const GROUP_SHORT: Record<OfferGroup, string> = {
  '2_MONTH': '2-month',
  '6_MONTH': '6-month',
  WINTER: 'Winter',
  FULL_TIME: 'Full-time',
};

type StudentPick = {
  name: string;
  rollNo: string | null;
  branch: string | null;
  money: string | null;
  converted: boolean;
  onCampus: boolean;
};

export type YearData = {
  year: string;
  roles: string[];
  batches: {
    batch: number;
    label: string;
    groups: {
      group: OfferGroup;
      count: number;
      avgPackage: string | null;
      students: StudentPick[];
    }[];
  }[];
};

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const company = await db.company.findUnique({
    where: { id },
    include: {
      drives: { where: { type: { not: 'Off-campus' } }, orderBy: { deadline: 'desc' } },
      _count: { select: { drives: true } },
    },
  });
  if (!company) notFound();

  const offers = await db.offer.findMany({
    where: { drive: { companyId: id } },
    include: {
      student: { include: { user: { select: { name: true } } } },
      drive: { select: { academicYear: true, yearOfStudy: true } },
    },
    orderBy: { offeredOn: 'desc' },
  });

  const tree = new Map<string, Map<number, Map<OfferGroup, StudentPick[]>>>();
  const ensure = (year: string) => {
    if (!tree.has(year)) tree.set(year, new Map());
    return tree.get(year)!;
  };
  for (const d of company.drives) ensure(d.academicYear ?? 'Unscheduled');
  for (const o of offers) {
    const year = ensure(o.drive.academicYear ?? 'Unscheduled');
    const batch = o.student.batch ?? 0;
    if (!year.has(batch)) year.set(batch, new Map());
    const g = offerGroup(o.offerType);
    const byGroup = year.get(batch)!;
    byGroup.set(g, [
      ...(byGroup.get(g) ?? []),
      {
        name: o.student.user.name ?? o.student.rollNo ?? 'Unnamed',
        rollNo: o.student.rollNo,
        branch: o.student.branchCode,
        money: offerMoney(o),
        converted: !!o.convertedFrom,
        onCampus: o.isOnCampus,
      },
    ]);
  }
  const yearKeys = [...tree.keys()].sort().reverse();

  const packaged = offers.filter((o) => o.ctc > 0);
  const highest = packaged.reduce((m, o) => Math.max(m, o.ctc), 0);
  const converted = offers.filter((o) => o.convertedFrom).length;
  const students = new Set(offers.map((o) => o.studentId)).size;

  const tiles = [
    { icon: CalendarDays, label: 'Visits', value: <CountUp to={yearKeys.filter((y) => y !== 'Unscheduled').length || company._count.drives} />, color: 'var(--o-6m)' },
    { icon: Users, label: 'Students selected', value: <CountUp to={students} />, color: 'var(--o-2m)' },
    { icon: Rocket, label: 'Converted to PPO', value: <CountUp to={converted} />, color: 'var(--o-full)' },
    { icon: Trophy, label: 'Highest package', value: <>{highest ? lpa(highest) : '—'}</>, color: 'var(--o-winter)' },
  ];

  const yearData: YearData[] = yearKeys.map((year) => {
    const batchMap = tree.get(year)!;
    const drives = company.drives.filter((d) => (d.academicYear ?? 'Unscheduled') === year);
    return {
      year,
      roles: drives.map((d) => d.role),
      batches: [...batchMap.entries()]
        .sort((a, b) => b[0] - a[0])
        .map(([batch, groupMap]) => ({
          batch,
          label: yearLabelOfBatch(batch || null),
          groups: OFFER_GROUPS.filter((g) => groupMap.has(g)).map((g) => {
            const picks = groupMap.get(g)!;
            const moneyVals = picks
              .map((p) => p.money)
              .filter((m): m is string => !!m);
            return {
              group: g,
              count: picks.length,
              avgPackage: moneyVals.length > 0 ? moneyVals[0] : null,
              students: picks,
            };
          }),
        })),
    };
  });

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-7">
      <Link href="/admin/companies" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-blue">
        <ArrowLeft size={15} /> All companies
      </Link>

      <section className="arrive relative overflow-hidden rounded-3xl border border-line bg-surface">
        {/* Gradient background */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <span className="absolute -right-20 -top-20 size-80 rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, var(--o-2m), transparent 70%)' }} />
          <span className="absolute -bottom-16 -left-16 size-60 rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, var(--o-full), transparent 70%)' }} />
          <span className="absolute right-1/3 top-1/2 size-40 rounded-full opacity-[0.05]" style={{ background: 'radial-gradient(circle, var(--o-6m), transparent 70%)' }} />
        </div>

        {/* Company info */}
        <div className="relative flex flex-wrap items-center gap-5 p-6 pb-0 md:p-8 md:pb-0">
          <CompanyMark name={company.name} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="display text-[clamp(1.9rem,4vw,2.8rem)]">{company.name}</h1>
            <p className="mt-1 text-muted">
              {[company.sector, company.hq].filter(Boolean).join(', ') || 'No sector recorded'}
            </p>
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm text-blue hover:underline"
              >
                <ExternalLink size={14} /> Website
              </a>
            )}
          </div>
        </div>

        {/* Stat tiles */}
        <dl className="relative mt-6 grid grid-cols-2 gap-px border-t border-line/50 bg-line/30 md:grid-cols-4">
          {tiles.map((t, i) => (
            <div
              key={t.label}
              className="relative overflow-hidden bg-surface px-5 py-5"
            >
              <span
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{ background: `linear-gradient(135deg, ${t.color}, transparent 60%)` }}
              />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <span
                    className="grid size-8 place-items-center rounded-lg"
                    style={{
                      color: t.color,
                      backgroundColor: `color-mix(in oklab, ${t.color} 12%, transparent)`,
                    }}
                  >
                    <t.icon size={16} />
                  </span>
                  <dt className="text-xs text-muted">{t.label}</dt>
                </div>
                <dd
                  className="tnum display mt-2 text-3xl"
                  style={{ color: t.color }}
                >
                  {t.value}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2 className="display text-xl">Visit history</h2>
        <p className="mt-1 text-sm text-muted">Year-wise breakdown of hiring activity.</p>

        {yearKeys.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-line px-6 py-12 text-center text-sm text-muted">
            This company has not visited yet.
          </p>
        ) : (
          <VisitHistory data={yearData} />
        )}
      </section>
    </div>
  );
}
