import Link from 'next/link';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/dal';
import { getPlacementRows, getSeasons, getStudentStatuses } from '@/lib/placements';
import { GROUP_LABEL, OFFER_GROUPS, isIntern, offerGroup, yearLabelOfBatch, type OfferGroup } from '@/lib/types';
import { cn, lpa } from '@/lib/utils';
import { Rocket } from 'lucide-react';
import { CountUp } from '@/components/ui/CountUp';
import {
  BatchStackChart,
  BranchPlacementChart,
  CompanyBarChart,
  CtcHistogram,
  CtcTrendChart,
  DonutChart,
} from '@/components/charts/Charts';

export const metadata: Metadata = { title: 'Analytics' };

const BANDS: [string, number, number][] = [
  ['<5', 0, 5],
  ['5-10', 5, 10],
  ['10-15', 10, 15],
  ['15-20', 15, 20],
  ['20-30', 20, 30],
  ['30+', 30, Infinity],
];

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const a = [...xs].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m]! : (a[m - 1]! + a[m]!) / 2;
};

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  await requireAdmin();
  const { year } = await searchParams;
  const [seasons, everyRow, students] = await Promise.all([
    getSeasons(),
    getPlacementRows(),
    getStudentStatuses(),
  ]);
  const season = year && seasons.includes(year) ? year : 'ALL';
  const rows = season === 'ALL' ? everyRow : everyRow.filter((r) => r.academicYear === season);

  const placedIds = new Set(rows.map((r) => r.studentId));
  const placed = placedIds.size;
  const unplaced = Math.max(0, students.length - placed);
  const fullTime = rows.filter((r) => !isIntern(r.offerType) && r.ctc > 0);
  const ctcs = fullTime.map((r) => r.ctc);
  const highest = ctcs.length ? Math.max(...ctcs) : 0;
  const companies = new Set(rows.map((r) => r.company)).size;

  const byBranch = new Map<string, { cohort: number; placed: number }>();
  for (const s of students) {
    const b = s.branchCode ?? 'Unset';
    const e = byBranch.get(b) ?? { cohort: 0, placed: 0 };
    e.cohort++;
    if (placedIds.has(s.studentId)) e.placed++;
    byBranch.set(b, e);
  }
  const branchData = [...byBranch.entries()].map(([branch, e]) => ({
    branch,
    placed: e.placed,
    cohort: e.cohort,
    pct: e.cohort ? Math.round((e.placed / e.cohort) * 100) : 0,
  }));

  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.company, (counts.get(r.company) ?? 0) + 1);
  const companyData = [...counts.entries()]
    .map(([company, count]) => ({ company, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const histogram = BANDS.map(([label, lo, hi]) => ({
    label,
    count: ctcs.filter((c) => c / 100000 >= lo && c / 100000 < hi).length,
  }));

  const trend = [...new Set(everyRow.map((r) => r.academicYear).filter(Boolean))]
    .sort()
    .map((s) => {
      const v = everyRow
        .filter((r) => r.academicYear === s && !isIntern(r.offerType) && r.ctc > 0)
        .map((r) => r.ctc / 100000);
      return {
        season: s as string,
        average: v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : 0,
        median: Math.round(median(v) * 10) / 10,
      };
    })
    .filter((t) => t.average > 0);

  const GROUP_COLOR: Record<OfferGroup, string> = {
    '2_MONTH': 'var(--o-2m)',
    '6_MONTH': 'var(--o-6m)',
    WINTER: 'var(--o-winter)',
    FULL_TIME: 'var(--o-full)',
  };

  // Each student counts once, in the furthest stage they have reached.
  const stageOf = new Map<string, OfferGroup>();
  const convertedIds = new Set<string>();
  for (const r of rows) {
    const g = offerGroup(r.offerType);
    const cur = stageOf.get(r.studentId);
    // Rows arrive newest first, so the first intern offer seen is the latest.
    if (!cur || (g === 'FULL_TIME' && cur !== 'FULL_TIME')) stageOf.set(r.studentId, g);
    if (r.convertedFrom) convertedIds.add(r.studentId);
  }
  const stageCount: Record<OfferGroup, number> = { '2_MONTH': 0, '6_MONTH': 0, WINTER: 0, FULL_TIME: 0 };
  for (const g of stageOf.values()) stageCount[g]++;
  const interning = stageCount['2_MONTH'] + stageCount['6_MONTH'] + stageCount.WINTER;
  const conversionRate = convertedIds.size + interning ? Math.round((convertedIds.size / (convertedIds.size + interning)) * 100) : 0;

  const typeData = OFFER_GROUPS.map((g) => ({
    name: g === 'FULL_TIME' ? 'Full-time (incl. PPO)' : GROUP_LABEL[g],
    value: stageCount[g],
    color: GROUP_COLOR[g],
  }));

  const batchRows = new Map<string, Record<string, string | number>>();
  for (const [studentId, g] of stageOf) {
    const batch = rows.find((r) => r.studentId === studentId)?.batch ?? null;
    const label = batch ? `${batch} · ${yearLabelOfBatch(batch)}` : 'Unknown';
    const e = batchRows.get(label) ?? { batch: label, '2_MONTH': 0, '6_MONTH': 0, WINTER: 0, FULL_TIME: 0 };
    e[g] = (e[g] as number) + 1;
    batchRows.set(label, e);
  }
  const batchData = [...batchRows.values()].sort((a, b) => String(a.batch).localeCompare(String(b.batch)));

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-7">
      <div className="arrive flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[clamp(1.7rem,3.6vw,2.3rem)]">Analytics</h1>
          <p className="mt-2 text-muted">
            Computed live from the offers you record, so these never drift from the rest of the portal.
          </p>
        </div>
        <nav className="flex flex-wrap gap-1.5" aria-label="Academic year">
          {['ALL', ...seasons].map((s) => (
            <Link
              key={s}
              href={s === 'ALL' ? '/admin/analytics' : `/admin/analytics?year=${s}`}
              className={cn(
                'tnum rounded-full border px-3 py-1.5 text-sm transition-colors',
                s === season ? 'border-blue bg-blue-wash text-blue' : 'border-line bg-surface text-muted hover:text-ink',
              )}
            >
              {s === 'ALL' ? 'All years' : s}
            </Link>
          ))}
        </nav>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {OFFER_GROUPS.map((g, i) => (
          <div
            key={g}
            className="tint-tile shine shine-auto lift arrive rounded-2xl p-5"
            style={{ '--tint': GROUP_COLOR[g], '--shine-delay': `${i * 1.3}s`, animationDelay: `${i * 60}ms` } as React.CSSProperties}
          >
            <p className="text-sm text-muted">{g === 'FULL_TIME' ? 'Full-time (incl. PPO)' : GROUP_LABEL[g]}</p>
            <p className="tnum display mt-2 text-[clamp(2.2rem,4vw,3rem)]" style={{ color: GROUP_COLOR[g] }}>
              <CountUp to={stageCount[g]} />
            </p>
            <p className="text-xs text-muted">{g === 'FULL_TIME' ? `${convertedIds.size} came through an internship` : 'currently interning'}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="rim shine arrive relative overflow-hidden rounded-2xl bg-surface p-5">
          <span className="halo -right-6 -top-10 size-40 bg-arch/30" aria-hidden />
          <p className="flex items-center gap-2 text-sm text-muted">
            <Rocket size={16} className="text-arch" /> Internship to full-time conversion
          </p>
          <p className="tnum display mt-2 text-5xl text-gradient">{conversionRate}%</p>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-surface-2">
            <div className="grow-x h-full rounded-full bg-gradient-to-r from-blue via-trace to-arch" style={{ width: `${conversionRate}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">
            {convertedIds.size} converted, {interning} still interning
          </p>
        </div>
        <div className="tint-tile lift arrive rounded-2xl p-5" style={{ '--tint': 'var(--trace)' } as React.CSSProperties}>
          <p className="text-sm text-muted">Students placed</p>
          <p className="tnum display mt-2 text-4xl">
            <CountUp to={placed} />
            <span className="ml-1 text-base text-muted">of {students.length}</span>
          </p>
          <p className="text-xs text-muted">{companies} companies, {rows.length} offers</p>
        </div>
        <div className="tint-tile lift arrive rounded-2xl p-5" style={{ '--tint': 'var(--arch)' } as React.CSSProperties}>
          <p className="text-sm text-muted">Highest package</p>
          <p className="tnum display mt-2 text-4xl text-arch">{highest ? lpa(highest) : '—'}</p>
          <p className="text-xs text-muted">
            {ctcs.length ? `${lpa(Math.round(ctcs.reduce((a, b) => a + b, 0) / ctcs.length))} average` : 'No full-time offers yet'}
          </p>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <DonutChart
          title="Placed vs not placed yet"
          data={[
            { name: 'Placed', value: placed, color: 'var(--trace)' },
            { name: 'Not placed yet', value: unplaced, color: 'var(--line)' },
          ]}
          centre={{
            value: `${students.length ? Math.round((placed / students.length) * 100) : 0}%`,
            label: 'placed',
          }}
        />
        <DonutChart title="Where students are now" note="Each student counted once, at their furthest stage." data={typeData} centre={{ value: String(stageOf.size), label: 'students' }} />
        <BatchStackChart
          data={batchData}
          series={OFFER_GROUPS.map((g) => ({ key: g, label: g === 'FULL_TIME' ? 'Full-time (incl. PPO)' : GROUP_LABEL[g], color: GROUP_COLOR[g] }))}
        />
        <CompanyBarChart data={companyData} />
        <BranchPlacementChart data={branchData} />
        <CtcHistogram data={histogram} />
        {trend.length > 0 ? (
          <CtcTrendChart data={trend} />
        ) : (
          <div className="grid place-items-center rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
            The package trend appears once full-time offers exist in at least one year.
          </div>
        )}
      </section>
    </div>
  );
}
