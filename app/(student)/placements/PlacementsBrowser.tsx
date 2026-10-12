'use client';

import { useMemo, useState } from 'react';
import { Building2, Rocket, Search, Sparkles, Users } from 'lucide-react';
import { cn, offerMoney, shortDate } from '@/lib/utils';
import {
  GROUP_LABEL,
  OFFER_GROUPS,
  isIntern,
  offerGroup,
  type OfferGroup,
  type OfferType,
} from '@/lib/types';
import { CompanyMark, EmptyState } from '@/components/ui/kit';
import { OFFER_DOT, OfferBadge } from '@/components/ui/OfferBadge';
import { StudentProfileCard, type CardStudent } from '@/components/app/StudentProfileCard';
import { CountUp } from '@/components/ui/CountUp';

export type PStudent = {
  studentId: string;
  name: string;
  email?: string;
  rollNo: string | null;
  branchCode: string | null;
  batch: number | null;
  cgpa: number | null;
  skills: string[];
  linkedinUrl: string | null;
  yearLabel: string;
  offers: {
    offerId: string;
    company: string;
    role: string;
    offerType: OfferType;
    convertedFrom: OfferType | null;
    ctc: number;
    stipend: number | null;
    isOnCampus: boolean;
    offeredOn: string;
  }[];
};

const TINT: Record<OfferGroup, string> = {
  '2_MONTH': 'var(--o-2m)',
  '6_MONTH': 'var(--o-6m)',
  WINTER: 'var(--o-winter)',
  FULL_TIME: 'var(--o-full)',
};

const hasFullTime = (s: PStudent) => s.offers.some((o) => !isIntern(o.offerType));
const converted = (s: PStudent) => s.offers.some((o) => o.convertedFrom);
const primary = (s: PStudent): OfferGroup => {
  if (hasFullTime(s)) return 'FULL_TIME';
  const latest = [...s.offers].sort((a, b) => b.offeredOn.localeCompare(a.offeredOn))[0]!;
  return offerGroup(latest.offerType);
};

type Status = 'ALL' | 'INTERNING' | 'CONVERTED' | 'DIRECT';
const STATUS_LABEL: Record<Status, string> = {
  ALL: 'Everyone',
  INTERNING: 'Interning now',
  CONVERTED: 'Converted to full-time',
  DIRECT: 'Direct full-time',
};

function statusOf(s: PStudent): Exclude<Status, 'ALL'> {
  if (converted(s)) return 'CONVERTED';
  if (hasFullTime(s)) return 'DIRECT';
  return 'INTERNING';
}

export function PlacementsBrowser({ students }: { students: PStudent[] }) {
  const [group, setGroup] = useState<OfferGroup | 'ALL'>('ALL');
  const [status, setStatus] = useState<Status>('ALL');
  const [year, setYear] = useState('ALL');
  const [sort, setSort] = useState<'recent' | 'cgpa' | 'name'>('recent');
  const [view, setView] = useState<'students' | 'companies'>('students');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<PStudent | null>(null);

  const counts = useMemo(() => {
    const c: Record<OfferGroup, number> = { '2_MONTH': 0, '6_MONTH': 0, WINTER: 0, FULL_TIME: 0 };
    for (const s of students) c[primary(s)]++;
    return c;
  }, [students]);
  const convertedCount = students.filter(converted).length;
  const interning = students.filter((s) => !hasFullTime(s)).length;
  const rate = convertedCount + interning ? Math.round((convertedCount / (convertedCount + interning)) * 100) : 0;
  const years = useMemo(() => ['ALL', ...new Set(students.map((s) => s.yearLabel))], [students]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = students.filter((s) => {
      if (group !== 'ALL' && primary(s) !== group) return false;
      if (status !== 'ALL' && statusOf(s) !== status) return false;
      if (year !== 'ALL' && s.yearLabel !== year) return false;
      if (needle && ![s.name, s.rollNo, s.branchCode, ...s.offers.map((o) => o.company)].some((v) => v?.toLowerCase().includes(needle)))
        return false;
      return true;
    });
    const latest = (s: PStudent) => s.offers.reduce((m, o) => (o.offeredOn > m ? o.offeredOn : m), '');
    return out.sort((a, b) =>
      sort === 'cgpa' ? (b.cgpa ?? -1) - (a.cgpa ?? -1) : sort === 'name' ? a.name.localeCompare(b.name) : latest(b).localeCompare(latest(a)),
    );
  }, [students, group, status, year, q, sort]);

  const byCompany = useMemo(() => {
    const m = new Map<string, { s: PStudent; o: PStudent['offers'][number] }[]>();
    for (const s of list)
      for (const o of s.offers) m.set(o.company, [...(m.get(o.company) ?? []), { s, o }]);
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [list]);

  const card: CardStudent | null = open && {
    name: open.name,
    rollNo: open.rollNo,
    email: open.email,
    branchCode: open.branchCode,
    batch: open.batch,
    cgpa: open.cgpa,
    skills: open.skills,
    linkedinUrl: open.linkedinUrl,
    offers: open.offers,
  };

  const chip = (active: boolean) =>
    cn(
      'rounded-full border px-3 py-1.5 text-sm transition-colors',
      active ? 'border-blue bg-blue-wash text-blue' : 'border-line bg-surface text-muted hover:text-ink',
    );

  return (
    <div>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {OFFER_GROUPS.map((g, i) => (
          <button
            key={g}
            onClick={() => setGroup(group === g ? 'ALL' : g)}
            aria-pressed={group === g}
            style={{ '--tint': TINT[g], '--shine-delay': `${i * 1.2}s` } as React.CSSProperties}
            className={cn(
              'tint-tile shine shine-auto lift arrive rounded-2xl p-5 text-left',
              group !== 'ALL' && group !== g && 'opacity-55',
            )}
          >
            <span className="flex items-center gap-2 text-sm text-muted">
              <span className={cn('size-2.5 rounded-full', OFFER_DOT[g === '2_MONTH' ? '2_MONTH_INTERN' : g === '6_MONTH' ? '6_MONTH_INTERN' : g === 'WINTER' ? 'WINTER_INTERN' : 'FULL_TIME'])} />
              {g === 'FULL_TIME' ? 'Full-time (incl. PPO)' : GROUP_LABEL[g]}
            </span>
            <span className="tnum display mt-2 block text-[clamp(2.2rem,4vw,3rem)]" style={{ color: TINT[g] }}>
              <CountUp to={counts[g]} />
            </span>
            <span className="text-xs text-muted">
              {g === 'FULL_TIME' ? `${convertedCount} converted from internships` : 'currently interning'}
            </span>
          </button>
        ))}
      </section>

      <section className="rim shine relative mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 overflow-hidden rounded-2xl bg-surface px-5 py-4">
        <span className="halo -left-6 -top-10 size-40 bg-arch/30" aria-hidden />
        <span className="grid size-11 place-items-center rounded-full bg-arch-wash text-arch">
          <Rocket size={20} />
        </span>
        <p className="min-w-0 flex-1 text-sm">
          <span className="tnum display text-2xl text-arch">{rate}%</span>
          <span className="ml-2 text-muted">
            of internship students have converted to a full-time offer ({convertedCount} converted, {interning} still interning)
          </span>
        </p>
      </section>

      <section className="mt-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
            <button key={s} onClick={() => setStatus(s)} aria-pressed={status === s} className={chip(status === s)}>
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {years.map((y) => (
            <button key={y} onClick={() => setYear(y)} aria-pressed={year === y} className={chip(year === y)}>
              {y === 'ALL' ? 'All years' : y}
            </button>
          ))}
          <label className="relative ml-auto w-full sm:w-60">
            <Search size={15} className="pointer-events-none absolute left-3 top-3 text-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name, roll number or company"
              className="h-10 w-full rounded-[10px] border border-line bg-surface pl-9 pr-3 text-sm placeholder:text-faint focus:border-blue focus:outline-none"
            />
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            aria-label="Sort"
            className="h-10 rounded-[10px] border border-line bg-surface px-3 text-sm focus:border-blue focus:outline-none"
          >
            <option value="recent">Newest offers</option>
            <option value="cgpa">CGPA, high to low</option>
            <option value="name">Name A to Z</option>
          </select>
          <div className="inline-flex rounded-[10px] border border-line bg-surface-2 p-1">
            {(
              [
                ['students', 'Students', Users],
                ['companies', 'Companies', Building2],
              ] as const
            ).map(([k, label, Icon]) => (
              <button
                key={k}
                onClick={() => setView(k)}
                aria-pressed={view === k}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm',
                  view === k ? 'bg-surface font-medium text-blue shadow-[var(--shadow-lift)]' : 'text-muted',
                )}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <p className="tnum mt-5 text-sm text-muted">
        Showing {list.length} {list.length === 1 ? 'student' : 'students'}
      </p>

      {list.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={<Sparkles size={20} />}
            title="Nobody matches yet"
            body={
              students.length === 0
                ? 'No offers have been recorded for this year. Check back soon, or get your CV in shape in the meantime.'
                : 'Try clearing a filter or the search.'
            }
          />
        </div>
      ) : view === 'students' ? (
        <ul className="mt-4 grid gap-4 xl:grid-cols-2">
          {list.map((s, i) => {
            const st = statusOf(s);
            return (
              <li
                key={s.studentId}
                className="arrive lift shine rounded-2xl border border-line bg-surface p-4"
                style={{ animationDelay: `${Math.min(i, 10) * 35}ms` }}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => setOpen(s)}
                    className="niche grid size-12 shrink-0 place-items-center border border-line bg-blue-wash font-display text-blue transition-transform hover:scale-105"
                    aria-label={`Open ${s.name}`}
                  >
                    {s.name.trim().charAt(0).toUpperCase()}
                  </button>
                  <div className="min-w-0 flex-1">
                    <button onClick={() => setOpen(s)} className="block max-w-full truncate text-left text-base font-semibold hover:text-blue">
                      {s.name}
                    </button>
                    <p className="tnum truncate text-xs text-muted">
                      {[s.rollNo, s.branchCode, s.yearLabel, s.cgpa !== null && `CGPA ${s.cgpa.toFixed(2)}`].filter(Boolean).join('  ·  ')}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium',
                      st === 'INTERNING' && 'border-blue/30 bg-blue-wash text-blue',
                      st === 'CONVERTED' && 'border-o-full/40 bg-[color-mix(in_oklab,var(--o-full)_16%,transparent)] text-o-full',
                      st === 'DIRECT' && 'border-o-full/30 bg-[color-mix(in_oklab,var(--o-full)_10%,transparent)] text-o-full',
                    )}
                  >
                    {st === 'INTERNING' ? 'Interning now' : st === 'CONVERTED' ? 'Converted ✓' : 'Full-time'}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5">
                  {s.offers.map((o) => {
                    const g = offerGroup(o.offerType);
                    return (
                      <div
                        key={o.offerId}
                        className="flex items-center gap-3 rounded-lg border-l-[3px] bg-surface-2/50 py-2 pl-3 pr-3"
                        style={{ borderLeftColor: TINT[g] }}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-[13px] font-medium text-ink">{o.company}</span>
                            {!o.isOnCampus && <span className="shrink-0 text-[10px] text-faint">off-campus</span>}
                          </span>
                          <span className="block truncate text-xs text-faint">
                            {o.role} · {shortDate(o.offeredOn)}
                          </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                          <OfferBadge type={o.offerType} convertedFrom={o.convertedFrom} />
                          {offerMoney(o) && <span className="tnum text-xs font-medium">{offerMoney(o)}</span>}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="mt-4 grid gap-4 xl:grid-cols-2">
          {byCompany.map(([company, items], i) => (
            <li
              key={company}
              className="arrive lift shine rounded-2xl border border-line bg-surface p-5"
              style={{ animationDelay: `${Math.min(i, 8) * 45}ms` }}
            >
              <div className="flex items-center gap-3">
                <CompanyMark name={company} />
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-medium">{company}</h3>
                  <p className="text-xs text-muted">{items.length} selected</p>
                </div>
              </div>
              <ul className="mt-4 flex flex-wrap gap-2">
                {items.map(({ s, o }) => (
                  <li key={o.offerId}>
                    <button
                      onClick={() => setOpen(s)}
                      className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 py-1 pl-1 pr-3 text-sm transition-colors hover:border-blue hover:bg-blue-wash"
                    >
                      <span className={cn('grid size-6 place-items-center rounded-full text-[10px] font-semibold text-white', OFFER_DOT[o.offerType])}>
                        {s.name.trim().charAt(0).toUpperCase()}
                      </span>
                      {s.name}
                      {s.offers.length > 1 && <span className="text-[10px] text-faint">+{s.offers.length - 1}</span>}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[...new Set(items.map((x) => x.o.offerType))].map((t) => (
                  <OfferBadge key={t} type={t} />
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}

      {card && <StudentProfileCard student={card} onClose={() => setOpen(null)} />}
    </div>
  );
}
