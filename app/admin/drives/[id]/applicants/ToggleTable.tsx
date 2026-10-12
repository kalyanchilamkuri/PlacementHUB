'use client';

import { useState, useTransition } from 'react';
import { Check, FileText, Minus, X } from 'lucide-react';
import { setRoundResult, setRoundResultsBulk } from '@/lib/actions/admin';
import { ROUND_TYPE_LABEL, STAGE_LABEL, type RoundResultValue, type RoundType, type Stage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge, type Tone } from '@/components/ui/kit';

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

const STAGE_TONE: Record<string, Tone> = {
  APPLIED: 'neutral',
  IN_PROGRESS: 'info',
  OFFER: 'ok',
  REJECTED: 'bad',
};

/** PENDING -> PASS -> FAIL -> PENDING */
const NEXT: Record<string, RoundResultValue> = {
  PENDING: 'PASS',
  PASS: 'FAIL',
  FAIL: 'PENDING',
};

function ResultToggle({
  value,
  label,
  onClick,
  disabled,
}: {
  value: string;
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
        'grid size-8 place-items-center rounded-lg border transition-colors disabled:opacity-50',
        value === 'PASS' && 'border-ok/40 bg-trace-wash text-ok',
        value === 'FAIL' && 'border-bad/40 bg-[color-mix(in_oklab,var(--bad)_12%,transparent)] text-bad',
        value === 'PENDING' && 'border-line bg-surface-2 text-faint hover:border-blue hover:text-blue',
      )}
    >
      {value === 'PASS' ? <Check size={16} /> : value === 'FAIL' ? <X size={16} /> : <Minus size={14} />}
    </button>
  );
}

export function ToggleTable({ rounds, rows }: { rounds: Round[]; rows: Row[] }) {
  // Mirrored locally so a click lands instantly; the action revalidates behind it.
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

  return (
    <>
      {selected.size > 0 && (
        <div className="glass-deep sticky top-[72px] z-30 mb-3 flex flex-wrap items-center gap-3 rounded-2xl p-3.5">
          <span className="tnum text-sm font-medium">
            {selected.size} selected
          </span>
          <label className="text-sm">
            <span className="sr-only">Round to mark</span>
            <select
              value={bulkRound}
              onChange={(e) => setBulkRound(e.target.value)}
              className="h-9 rounded-[10px] border border-line bg-surface px-3 text-sm focus:border-blue focus:outline-none"
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
            className="h-9 rounded-[10px] border border-ok/40 bg-trace-wash px-3.5 text-sm font-medium text-ok disabled:opacity-50"
          >
            Mark passed
          </button>
          <button
            onClick={() => applyBulk('FAIL')}
            disabled={pending}
            className="h-9 rounded-[10px] border border-bad/40 bg-[color-mix(in_oklab,var(--bad)_10%,transparent)] px-3.5 text-sm font-medium text-bad disabled:opacity-50"
          >
            Mark not passed
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-sm text-muted hover:text-ink"
          >
            Clear
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[820px] text-sm">
          <caption className="sr-only">
            Applicants and their result in each round. Each round cell cycles between pending,
            passed and not passed.
          </caption>
          <thead>
            <tr className="border-b bg-surface-2 text-left">
              <th scope="col" className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select every applicant"
                  className="size-4 accent-[var(--blue)]"
                />
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Student
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                CGPA
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Resume
              </th>
              {rounds.map((r) => (
                <th key={r.id} scope="col" className="px-3 py-3 text-center font-semibold">
                  <span className="block">{r.name}</span>
                  <span className="block text-[11px] font-normal text-muted">
                    {ROUND_TYPE_LABEL[r.type as RoundType] ?? r.type}
                  </span>
                </th>
              ))}
              <th scope="col" className="px-4 py-3 font-semibold">
                Stage
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isSelected = selected.has(row.applicationId);
              // Recomputed locally so the column and the badge agree before the refresh.
              const vals = rounds.map((r) => valueOf(row.applicationId, r.id));
              const stage: Stage = vals.includes('FAIL')
                ? 'REJECTED'
                : vals.every((v) => v === 'PASS') && rounds.length > 0
                  ? 'OFFER'
                  : vals.some((v) => v === 'PASS')
                    ? 'IN_PROGRESS'
                    : 'APPLIED';

              return (
                <tr
                  key={row.applicationId}
                  className={cn('border-b last:border-0', isSelected && 'bg-blue-wash')}
                >
                  <td className="px-4 py-3">
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
                      className="size-4 accent-[var(--blue)]"
                    />
                  </td>
                  <th scope="row" className="px-4 py-3 text-left font-medium">
                    {row.name}
                    <span className="tnum mt-0.5 block text-xs font-normal text-muted">
                      {[row.rollNo, row.branch].filter(Boolean).join(', ') || row.email}
                    </span>
                  </th>
                  <td className="tnum px-4 py-3 text-right">
                    {row.cgpa?.toFixed(2) ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    {row.resumeUrl ? (
                      <a
                        href={row.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue hover:underline"
                      >
                        <FileText size={14} />
                        Open
                      </a>
                    ) : (
                      <span className="text-faint">None</span>
                    )}
                  </td>
                  {rounds.map((r) => (
                    <td key={r.id} className="px-3 py-3">
                      <div className="flex justify-center">
                        <ResultToggle
                          value={valueOf(row.applicationId, r.id)}
                          label={`${row.name}, ${r.name}`}
                          disabled={pending}
                          onClick={() => toggle(row.applicationId, r.id)}
                        />
                      </div>
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <Badge tone={STAGE_TONE[stage]}>{STAGE_LABEL[stage]}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-muted">
        A cell cycles pending, passed, not passed. Clearing every round records an offer and
        updates the student&rsquo;s tracker.
      </p>
    </>
  );
}
