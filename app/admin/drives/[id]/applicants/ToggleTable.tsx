'use client';

import { useState, useTransition } from 'react';
import { Check, ChevronDown, FileText, Minus, X } from 'lucide-react';
import { setRoundResult, setRoundResultsBulk } from '@/lib/actions/admin';
import { ROUND_TYPE_LABEL, STAGE_LABEL, type RoundResultValue, type RoundType, type Stage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { type Tone } from '@/components/ui/kit';

type Round = { id: string; name: string; type: string };

type Row = {
  applicationId: string;
  name: string;
  email: string;
  rollNo: string | null;
  branch: string | null;
  cgpa: number | null;
  resumeUrl: string | null;
  stage: string;
  results: Record<string, string>;
};

const STAGE_COLOR: Record<string, string> = {
  APPLIED: 'var(--muted)',
  IN_PROGRESS: 'var(--o-6m)',
  OFFER: 'var(--o-full)',
  REJECTED: 'var(--o-winter)',
};

const NEXT: Record<string, RoundResultValue> = {
  PENDING: 'PASS',
  PASS: 'FAIL',
  FAIL: 'PENDING',
};

function ResultToggle({
  value,
  roundName,
  label,
  onClick,
  disabled,
}: {
  value: string;
  roundName: string;
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={`${label}: ${value === 'PASS' ? 'passed' : value === 'FAIL' ? 'not passed' : 'pending'}. Click to change.`}
      className={cn(
        'flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 disabled:opacity-50',
        value === 'PASS' && 'border border-ok/30 bg-trace-wash text-ok',
        value === 'FAIL' && 'border border-bad/30 bg-[color-mix(in_oklab,var(--bad)_10%,transparent)] text-bad',
        value === 'PENDING' && 'border border-line/50 bg-surface-2/40 text-faint hover:border-blue/30 hover:text-blue',
      )}
    >
      <span
        className={cn(
          'grid size-5 shrink-0 place-items-center rounded-md',
          value === 'PASS' && 'bg-ok/20',
          value === 'FAIL' && 'bg-bad/20',
          value === 'PENDING' && 'bg-surface-2',
        )}
      >
        {value === 'PASS' ? <Check size={12} strokeWidth={3} /> : value === 'FAIL' ? <X size={12} strokeWidth={3} /> : <Minus size={10} />}
      </span>
      <span className="hidden sm:inline">{roundName}</span>
    </button>
  );
}

function StudentInitials({ name }: { name: string }) {
  const parts = name.split(' ');
  const initials = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0][0];
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue/20 to-[var(--o-2m)]/20 text-xs font-bold text-blue">
      {initials.toUpperCase()}
    </span>
  );
}

export function ToggleTable({ rounds, rows }: { rounds: Round[]; rows: Row[] }) {
  const [results, setResults] = useState<Record<string, Record<string, string>>>(() =>
    Object.fromEntries(rows.map((r) => [r.applicationId, { ...r.results }])),
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkRound, setBulkRound] = useState(rounds[0]?.id ?? '');
  const [pending, start] = useTransition();

  const valueOf = (applicationId: string, roundId: string) =>
    results[applicationId]?.[roundId] ?? 'PENDING';

  const toggle = (applicationId: string, roundId: string) => {
    const next = NEXT[valueOf(applicationId, roundId)]!;
    setResults((prev) => ({
      ...prev,
      [applicationId]: { ...prev[applicationId], [roundId]: next },
    }));
    start(() => void setRoundResult(applicationId, roundId, next));
  };

  const applyBulk = (result: RoundResultValue) => {
    const ids = [...selected];
    if (!bulkRound || ids.length === 0) return;
    setResults((prev) => {
      const copy = { ...prev };
      for (const id of ids) copy[id] = { ...copy[id], [bulkRound]: result };
      return copy;
    });
    start(() => void setRoundResultsBulk(bulkRound, ids, result));
    setSelected(new Set());
  };

  const allSelected = selected.size === rows.length && rows.length > 0;
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.applicationId)));

  const getStage = (applicationId: string): Stage => {
    const vals = rounds.map((r) => valueOf(applicationId, r.id));
    if (vals.includes('FAIL')) return 'REJECTED';
    if (vals.every((v) => v === 'PASS') && rounds.length > 0) return 'OFFER';
    if (vals.some((v) => v === 'PASS')) return 'IN_PROGRESS';
    return 'APPLIED';
  };

  return (
    <>
      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="glass-deep sticky top-[72px] z-30 mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-blue/20 p-4">
          <span
            className="tnum grid size-8 place-items-center rounded-lg text-sm font-bold"
            style={{
              color: 'var(--blue)',
              backgroundColor: 'color-mix(in oklab, var(--blue) 14%, transparent)',
            }}
          >
            {selected.size}
          </span>
          <span className="text-sm font-medium">selected</span>
          <label className="text-sm">
            <span className="sr-only">Round to mark</span>
            <select
              value={bulkRound}
              onChange={(e) => setBulkRound(e.target.value)}
              className="h-9 rounded-xl border border-line bg-surface px-3 text-sm focus:border-blue focus:outline-none"
            >
              {rounds.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => applyBulk('PASS')}
            disabled={pending}
            className="h-9 rounded-xl border border-ok/40 bg-trace-wash px-4 text-sm font-medium text-ok transition-colors hover:bg-ok/15 disabled:opacity-50"
          >
            <Check size={14} className="mr-1.5 inline" /> Pass
          </button>
          <button
            onClick={() => applyBulk('FAIL')}
            disabled={pending}
            className="h-9 rounded-xl border border-bad/40 bg-[color-mix(in_oklab,var(--bad)_10%,transparent)] px-4 text-sm font-medium text-bad transition-colors hover:bg-bad/15 disabled:opacity-50"
          >
            <X size={14} className="mr-1.5 inline" /> Fail
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-sm text-muted hover:text-ink"
          >
            Clear
          </button>
        </div>
      )}

      {/* Select all bar */}
      <div className="mb-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="size-4 accent-[var(--blue)]"
          />
          Select all ({rows.length})
        </label>
        <span className="text-xs text-faint">Click round pills to toggle status</span>
      </div>

      {/* Student cards */}
      <div className="space-y-2">
        {rows.map((row, idx) => {
          const isSelected = selected.has(row.applicationId);
          const stage = getStage(row.applicationId);
          const stageColor = STAGE_COLOR[stage];
          const passedCount = rounds.filter((r) => valueOf(row.applicationId, r.id) === 'PASS').length;
          const progress = rounds.length > 0 ? (passedCount / rounds.length) * 100 : 0;

          return (
            <div
              key={row.applicationId}
              className={cn(
                'arrive group relative overflow-hidden rounded-2xl border transition-all duration-200',
                isSelected
                  ? 'border-blue/40 bg-blue-wash/20'
                  : 'border-line/60 bg-surface hover:border-line hover:shadow-[0_2px_8px_rgb(0_0_0/.06)]',
              )}
              style={{ animationDelay: `${Math.min(idx, 15) * 30}ms` }}
            >
              {/* Progress bar at top */}
              <div className="h-[2px] w-full bg-line/20">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${progress}%`,
                    background: stage === 'REJECTED'
                      ? 'var(--bad)'
                      : stage === 'OFFER'
                        ? 'var(--o-full)'
                        : 'var(--blue)',
                  }}
                />
              </div>

              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                {/* Checkbox + Student info */}
                <div className="flex items-center gap-3 sm:min-w-[220px]">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() =>
                      setSelected((s) => {
                        const next = new Set(s);
                        if (next.has(row.applicationId)) next.delete(row.applicationId);
                        else next.add(row.applicationId);
                        return next;
                      })
                    }
                    aria-label={`Select ${row.name}`}
                    className="size-4 shrink-0 accent-[var(--blue)]"
                  />
                  <StudentInitials name={row.name} />
                  <div className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-ink">{row.name}</span>
                    <span className="tnum flex items-center gap-1.5 text-xs text-muted">
                      {row.rollNo && <span>{row.rollNo}</span>}
                      {row.branch && (
                        <span className="rounded-md bg-surface-2/80 px-1.5 py-px text-[10px] font-medium">
                          {row.branch}
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                {/* CGPA + Resume */}
                <div className="flex items-center gap-4 pl-[68px] sm:min-w-[120px] sm:pl-0">
                  {row.cgpa != null ? (
                    <span className="tnum text-sm">
                      <span className="text-faint">CGPA </span>
                      <span className="font-bold text-ink">{row.cgpa.toFixed(2)}</span>
                    </span>
                  ) : (
                    <span className="text-xs text-faint">No CGPA</span>
                  )}
                  {row.resumeUrl && (
                    <a
                      href={row.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-blue/20 bg-blue-wash/30 px-2 py-1 text-[11px] font-medium text-blue transition-colors hover:bg-blue-wash/60"
                    >
                      <FileText size={11} /> CV
                    </a>
                  )}
                </div>

                {/* Rounds */}
                <div className="flex flex-1 flex-wrap items-center gap-1.5 pl-[68px] sm:justify-center sm:pl-0">
                  {rounds.map((r) => (
                    <ResultToggle
                      key={r.id}
                      value={valueOf(row.applicationId, r.id)}
                      roundName={r.name}
                      label={`${row.name}, ${r.name}`}
                      disabled={pending}
                      onClick={() => toggle(row.applicationId, r.id)}
                    />
                  ))}
                </div>

                {/* Stage badge */}
                <div className="flex items-center pl-[68px] sm:min-w-[100px] sm:justify-end sm:pl-0">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold"
                    style={{
                      color: stageColor,
                      backgroundColor: `color-mix(in oklab, ${stageColor} 12%, transparent)`,
                      boxShadow: stage === 'OFFER' ? `0 0 12px color-mix(in oklab, ${stageColor} 15%, transparent)` : undefined,
                    }}
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: stageColor }}
                    />
                    {STAGE_LABEL[stage]}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-muted">
        Click round pills to cycle: pending → passed → not passed. Clearing every round records an offer.
      </p>
    </>
  );
}
