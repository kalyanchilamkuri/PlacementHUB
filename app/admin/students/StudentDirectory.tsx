'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Download, Filter, Search, Users } from 'lucide-react';
import { cn, offerMoney } from '@/lib/utils';
import { GROUP_LABEL, OFFER_GROUPS, OFFER_TYPE_LABEL, offerGroup, batchesByYear, type OfferGroup, type OfferType } from '@/lib/types';
import { Badge, EmptyState } from '@/components/ui/kit';
import { OFFER_DOT, OFFER_HEX, OfferBadge } from '@/components/ui/OfferBadge';
import { StudentProfileCard } from '@/components/app/StudentProfileCard';
import { VerifyToggle } from './VerifyToggle';

export type DirRow = {
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
};

type SortKey = 'name' | 'rollNo' | 'branchCode' | 'cgpa' | 'company' | 'ctc' | 'year';
type AdvFilter = null | '2M_TO_PPO' | '6M_TO_PPO' | 'ANY_INTERN_TO_FT' | '2M_AND_6M' | '2M_AND_WINTER' | '6M_AND_WINTER' | 'MULTI_OFFER';

const topCtc = (r: DirRow) => Math.max(0, ...r.offers.map((o) => o.ctc));
const companiesStr = (r: DirRow) => r.offers.map((o) => o.company).join(', ');

const SEL =
  'h-9 rounded-lg border border-line bg-surface px-3 text-sm focus:border-blue focus:outline-none';

const ADV_FILTERS: { key: AdvFilter; label: string }[] = [
  { key: '2M_TO_PPO', label: '2-month → converted to PPO' },
  { key: '6M_TO_PPO', label: '6-month → converted to PPO' },
  { key: 'ANY_INTERN_TO_FT', label: 'Any intern → full-time' },
  { key: '2M_AND_6M', label: 'Did both 2-month & 6-month' },
  { key: '2M_AND_WINTER', label: 'Did both 2-month & winter' },
  { key: '6M_AND_WINTER', label: 'Did both 6-month & winter' },
  { key: 'MULTI_OFFER', label: 'Multiple offers' },
];

function matchesAdvFilter(r: DirRow, f: AdvFilter): boolean {
  if (!f) return true;
  const types = r.offers.map((o) => o.offerType);
  const groups = types.map(offerGroup);
  const hasConverted = r.offers.some((o) => o.convertedFrom);
  switch (f) {
    case '2M_TO_PPO':
      return r.offers.some((o) => (o.offerType === 'PPO' || o.offerType === 'FULL_TIME') && o.convertedFrom === '2_MONTH_INTERN');
    case '6M_TO_PPO':
      return r.offers.some((o) => (o.offerType === 'PPO' || o.offerType === 'FULL_TIME') && o.convertedFrom === '6_MONTH_INTERN');
    case 'ANY_INTERN_TO_FT':
      return hasConverted || (groups.some((g) => g !== 'FULL_TIME') && groups.includes('FULL_TIME'));
    case '2M_AND_6M':
      return groups.includes('2_MONTH') && groups.includes('6_MONTH');
    case '2M_AND_WINTER':
      return groups.includes('2_MONTH') && groups.includes('WINTER');
    case '6M_AND_WINTER':
      return groups.includes('6_MONTH') && groups.includes('WINTER');
    case 'MULTI_OFFER':
      return r.offers.length >= 2;
    default:
      return true;
  }
}

function OfferJourney({ offers }: { offers: DirRow['offers'] }) {
  if (offers.length === 0) return <span className="text-xs text-faint">No offers</span>;

  const hasFt = offers.some((o) => o.offerType === 'FULL_TIME' || o.offerType === 'PPO');
  return (
    <div className="flex items-center gap-1">
      {offers.map((o, i) => {
        const isFinal = o.offerType === 'FULL_TIME' || o.offerType === 'PPO';
        const hex = OFFER_HEX[o.offerType] ?? OFFER_HEX.FULL_TIME;
        return (
          <div key={i} className="group/dot relative flex items-center gap-1">
            {i > 0 && <span className="h-px w-3 bg-line" />}
            <span
              className={cn(
                'size-3 rounded-full border-2 transition-transform',
                isFinal && hasFt ? 'scale-125 ring-2 ring-offset-1 ring-offset-surface' : '',
              )}
              style={{ backgroundColor: hex, borderColor: hex, ringColor: hex }}
              title={`${o.company} — ${OFFER_TYPE_LABEL[o.offerType]}`}
            />
            <span className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] text-bg shadow-lg group-hover/dot:block">
              {o.company} · {OFFER_TYPE_LABEL[o.offerType]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function StudentDirectory({ rows }: { rows: DirRow[] }) {
  const [status, setStatus] = useState<'ALL' | 'PLACED' | 'UNPLACED'>('ALL');
  const [type, setType] = useState<OfferGroup | 'ALL'>('ALL');
  const [yearTab, setYearTab] = useState('ALL');
  const [advFilter, setAdvFilter] = useState<AdvFilter>(null);
  const [showAdv, setShowAdv] = useState(false);
  const [branch, setBranch] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'rollNo', dir: 1 });
  const [open, setOpen] = useState<DirRow | null>(null);

  const branches = useMemo(() => [...new Set(rows.map((r) => r.branchCode).filter(Boolean))].sort() as string[], [rows]);

  const by = batchesByYear();
  const yearTabs = useMemo(() => {
    const batchSet = new Set(rows.map((r) => r.batch).filter(Boolean) as number[]);
    const tabs: { key: string; label: string; count: number }[] = [
      { key: 'ALL', label: 'All students', count: rows.length },
      { key: '4TH', label: `4th year (${by[4]})`, count: rows.filter((r) => r.batch === by[4]).length },
      { key: '3RD', label: `3rd year (${by[3]})`, count: rows.filter((r) => r.batch === by[3]).length },
    ];
    const recentPassedOut = [by[4] - 1, by[4] - 2].filter((b) => batchSet.has(b));
    for (const b of recentPassedOut) {
      tabs.push({ key: `PO_${b}`, label: `${b} passouts`, count: rows.filter((r) => r.batch === b).length });
    }
    const olderCount = rows.filter((r) => r.batch !== null && r.batch < (recentPassedOut[recentPassedOut.length - 1] ?? by[4] - 1)).length;
    if (olderCount > 0) {
      tabs.push({ key: 'OLDER', label: 'All passouts', count: olderCount });
    }
    return tabs.filter((t) => t.key === 'ALL' || t.count > 0);
  }, [rows, by]);

  const matchesYear = (r: DirRow) => {
    if (yearTab === 'ALL') return true;
    if (yearTab === '4TH') return r.batch === by[4];
    if (yearTab === '3RD') return r.batch === by[3];
    if (yearTab.startsWith('PO_')) return r.batch === Number(yearTab.slice(3));
    if (yearTab === 'OLDER') {
      const recentPassedOut = [by[4] - 1, by[4] - 2];
      return r.batch !== null && r.batch < by[3] && !recentPassedOut.includes(r.batch);
    }
    return true;
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = rows.filter((r) => {
      if (status === 'PLACED' && r.offers.length === 0) return false;
      if (status === 'UNPLACED' && r.offers.length > 0) return false;
      if (type !== 'ALL' && !r.offers.some((o) => offerGroup(o.offerType) === type)) return false;
      if (!matchesYear(r)) return false;
      if (branch && r.branchCode !== branch) return false;
      if (!matchesAdvFilter(r, advFilter)) return false;
      if (needle && ![r.name, r.email, r.rollNo, companiesStr(r)].some((v) => v?.toLowerCase().includes(needle))) return false;
      return true;
    });
    const val = (r: DirRow): string | number => {
      switch (sort.key) {
        case 'cgpa': return r.cgpa ?? -1;
        case 'ctc': return topCtc(r);
        case 'company': return companiesStr(r).toLowerCase();
        case 'year': return r.batch ?? 0;
        default: return (r[sort.key] ?? '').toString().toLowerCase();
      }
    };
    return [...list].sort((a, b) => {
      const x = val(a);
      const y = val(b);
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
    });
  }, [rows, status, type, yearTab, branch, q, sort, advFilter]);

  const placed = rows.filter((r) => r.offers.length > 0).length;

  function exportCsv() {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const head = ['Name', 'Email', 'Roll number', 'Branch', 'Batch', 'CGPA', 'Status', 'Company', 'Offer type', 'Package (LPA)', 'Mode'];
    const lines = [head.map(esc).join(',')];
    for (const r of filtered) {
      if (r.offers.length === 0)
        lines.push([r.name, r.email, r.rollNo, r.branchCode, r.batch, r.cgpa, 'Unplaced', '', '', '', ''].map(esc).join(','));
      for (const o of r.offers)
        lines.push(
          [r.name, r.email, r.rollNo, r.branchCode, r.batch, r.cgpa, 'Placed', o.company, OFFER_TYPE_LABEL[o.offerType], (o.ctc / 100000).toFixed(2), o.isOnCampus ? 'On-campus' : 'Off-campus']
            .map(esc)
            .join(','),
        );
    }
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const th = (key: SortKey, label: string, right = false) => (
    <th scope="col" className={cn('px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted', right && 'text-right')}>
      <button
        onClick={() => setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: 1 }))}
        className={cn('inline-flex items-center gap-1 hover:text-blue', sort.key === key && 'text-blue')}
      >
        {label}
        {sort.key === key && (sort.dir === 1 ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
      </button>
    </th>
  );

  return (
    <div>
      {/* Status cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ['ALL', 'All students', rows.length],
            ['PLACED', 'Placed', placed],
            ['UNPLACED', 'Not placed yet', rows.length - placed],
          ] as const
        ).map(([k, label, n]) => (
          <button
            key={k}
            onClick={() => setStatus(k)}
            aria-pressed={status === k}
            className={cn(
              'rounded-xl border p-4 text-left transition-all',
              status === k ? 'border-blue/30 bg-blue-wash shadow-[var(--shadow-lift)]' : 'border-line bg-surface hover:border-blue/20',
            )}
          >
            <span className="tnum display block text-3xl">{n}</span>
            <span className="text-sm text-muted">{label}</span>
          </button>
        ))}
        <div className="rounded-xl border border-line bg-surface p-4">
          <span className="tnum display block text-3xl text-blue">
            {rows.length ? Math.round((placed / rows.length) * 100) : 0}%
          </span>
          <span className="text-sm text-muted">Placement rate</span>
        </div>
      </div>

      {/* Year tabs */}
      <div className="mt-6">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-faint">Batch / Year</span>
        <div className="flex flex-wrap items-center gap-2">
          {yearTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setYearTab(t.key)}
              aria-pressed={yearTab === t.key}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors',
                yearTab === t.key ? 'border-blue bg-blue-wash font-medium text-blue' : 'border-line bg-surface text-muted hover:text-ink',
              )}
            >
              {t.label}
              <span className={cn('tnum text-xs', yearTab === t.key ? 'text-blue/60' : 'text-faint')}>{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Offer type filter — visually separated */}
      <div className="mt-4">
        <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-faint">Offer type</span>
        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', ...OFFER_GROUPS] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              aria-pressed={type === t}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors',
                type === t ? 'border-blue bg-blue-wash text-blue' : 'border-line bg-surface text-muted hover:text-ink',
              )}
            >
              {t !== 'ALL' && (
                <span className={cn('size-2 rounded-full', OFFER_DOT[{ '2_MONTH': '2_MONTH_INTERN', '6_MONTH': '6_MONTH_INTERN', WINTER: 'WINTER_INTERN', FULL_TIME: 'FULL_TIME' }[t]])} />
              )}
              {t === 'ALL' ? 'Any offer' : t === 'FULL_TIME' ? 'Full-time (incl. PPO)' : GROUP_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced filters (admin only) */}
      <div className="mt-4">
        <button
          onClick={() => setShowAdv((v) => !v)}
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-blue"
        >
          <Filter size={14} />
          Advanced filters
          <ChevronDown size={14} className={cn('transition-transform', showAdv && 'rotate-180')} />
        </button>
        {showAdv && (
          <div className="mt-2 flex flex-wrap gap-2 rounded-xl border border-line bg-surface-2/50 p-3">
            <button
              onClick={() => setAdvFilter(null)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                advFilter === null ? 'border-blue bg-blue-wash text-blue' : 'border-line bg-surface text-muted hover:text-ink',
              )}
            >
              None
            </button>
            {ADV_FILTERS.map((af) => (
              <button
                key={af.key}
                onClick={() => setAdvFilter(af.key)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-sm transition-colors',
                  advFilter === af.key ? 'border-blue bg-blue-wash text-blue' : 'border-line bg-surface text-muted hover:text-ink',
                )}
              >
                {af.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search + dropdowns */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <label className="relative min-w-[220px] flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-2.5 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, roll or company"
            className={cn(SEL, 'w-full pl-9')}
          />
        </label>
        <select value={branch} onChange={(e) => setBranch(e.target.value)} className={SEL} aria-label="Branch">
          <option value="">All branches</option>
          {branches.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        <select
          value={`${sort.key}:${sort.dir}`}
          onChange={(e) => {
            const [key, dir] = e.target.value.split(':');
            setSort({ key: key as SortKey, dir: Number(dir) as 1 | -1 });
          }}
          className={SEL}
          aria-label="Sort by"
        >
          <option value="cgpa:-1">Top CGPA first</option>
          <option value="cgpa:1">Lowest CGPA first</option>
          <option value="rollNo:1">Roll number</option>
          <option value="name:1">Name A → Z</option>
          <option value="ctc:-1">Highest package</option>
          <option value="year:1">Year (senior first)</option>
        </select>
        <button
          onClick={exportCsv}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm transition-colors hover:border-blue hover:text-blue"
        >
          <Download size={14} /> Export {filtered.length}
        </button>
      </div>

      {/* Results count */}
      <p className="mt-3 text-sm text-muted">
        Showing <span className="font-medium text-ink">{filtered.length}</span> student{filtered.length !== 1 ? 's' : ''}
        {advFilter && <span className="ml-1 text-blue">· {ADV_FILTERS.find((a) => a.key === advFilter)?.label}</span>}
      </p>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon={<Users size={20} />} title="No students match" body="Loosen a filter or clear the search." />
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[920px] text-sm">
            <thead>
              <tr className="border-b border-line bg-surface-2/60">
                {th('name', 'Student')}
                {th('rollNo', 'Roll')}
                <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Batch</th>
                {th('branchCode', 'Branch')}
                {th('cgpa', 'CGPA', true)}
                <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Offers</th>
                <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Journey</th>
                {th('ctc', 'Package', true)}
                <th scope="col" className="w-16 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {filtered.map((r, ri) => (
                <tr
                  key={r.studentId}
                  className={cn(
                    'transition-colors hover:bg-blue-wash/30',
                    ri % 2 === 1 && 'bg-surface-2/20',
                  )}
                >
                  <td className="px-4 py-3">
                    <button onClick={() => setOpen(r)} className="text-left hover:text-blue">
                      <span className="block font-medium">{r.name}</span>
                      <span className="block text-xs text-faint">{r.email}</span>
                    </button>
                  </td>
                  <td className="tnum px-4 py-3 text-muted">{r.rollNo ?? '—'}</td>
                  <td className="px-4 py-3">
                    {r.batch ? (
                      <span className="tnum text-sm text-muted">{r.batch}</span>
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {r.branchCode ? <Badge tone="info">{r.branchCode}</Badge> : <span className="text-faint">—</span>}
                  </td>
                  <td className="tnum px-4 py-3 text-right">{r.cgpa?.toFixed(2) ?? '—'}</td>
                  <td className="px-4 py-3">
                    {r.offers.length === 0 ? (
                      <span className="text-xs text-faint">Not placed</span>
                    ) : (
                      <div className="space-y-1">
                        {r.offers.map((o, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <OfferBadge type={o.offerType} convertedFrom={o.convertedFrom} />
                            <span className="text-xs text-muted">{o.company}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <OfferJourney offers={r.offers} />
                  </td>
                  <td className="tnum px-4 py-3 text-right">
                    {r.offers.length ? (
                      r.offers.map((o, i) => (
                        <span key={i} className="block text-sm">
                          {offerMoney(o) ?? '—'}
                        </span>
                      ))
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <VerifyToggle studentId={r.studentId} verified={r.verified} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <StudentProfileCard
          onClose={() => setOpen(null)}
          student={{
            name: open.name,
            rollNo: open.rollNo,
            email: open.email,
            branchCode: open.branchCode,
            batch: open.batch,
            cgpa: open.cgpa,
            skills: open.skills,
            linkedinUrl: open.linkedinUrl,
            offers: open.offers,
          }}
        />
      )}
    </div>
  );
}
