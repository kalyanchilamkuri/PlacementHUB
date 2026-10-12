'use client';

import { useState } from 'react';
import { ChevronDown, IndianRupee, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OfferGroup } from '@/lib/types';
import type { YearData } from './page';

const TINT: Record<OfferGroup, string> = {
  '2_MONTH': 'var(--o-2m)',
  '6_MONTH': 'var(--o-6m)',
  WINTER: 'var(--o-winter)',
  FULL_TIME: 'var(--o-full)',
};

const GROUP_LABEL: Record<OfferGroup, string> = {
  '2_MONTH': '2-month intern',
  '6_MONTH': '6-month intern',
  WINTER: 'Winter intern',
  FULL_TIME: 'Full-time',
};

export function VisitHistory({ data }: { data: YearData[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  return (
    <div className="mt-5 space-y-5">
      {data.map((yr, yi) => {
        const totalHired = yr.batches.reduce(
          (sum, b) => sum + b.groups.reduce((s, g) => s + g.count, 0),
          0,
        );

        return (
          <div
            key={yr.year}
            className="arrive overflow-hidden rounded-2xl border border-line bg-surface"
            style={{ animationDelay: `${yi * 60}ms` }}
          >
            {/* ── Year header ── */}
            <div className="relative overflow-hidden border-b border-line/50 px-6 py-5">
              <span
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{
                  background: `linear-gradient(135deg, var(--o-2m), var(--o-full))`,
                }}
              />
              <div className="relative flex flex-wrap items-center gap-x-4 gap-y-2">
                <h3 className="display tnum text-2xl">{yr.year}</h3>
                {yr.roles.length > 0 && (
                  <span className="rounded-full border border-line/50 bg-surface-2/60 px-3 py-1 text-xs text-muted">
                    {yr.roles.join(' · ')}
                  </span>
                )}
                <span
                  className="tnum ml-auto rounded-full px-3 py-1 text-sm font-bold"
                  style={{
                    color: 'var(--o-full)',
                    backgroundColor: 'color-mix(in oklab, var(--o-full) 12%, transparent)',
                  }}
                >
                  {totalHired} hired
                </span>
              </div>
            </div>

            {/* ── Batch sub-blocks ── */}
            {yr.batches.length === 0 ? (
              <p className="px-6 py-5 text-sm text-muted">No selections recorded.</p>
            ) : (
              <div className="divide-y divide-line/30">
                {yr.batches.map((b) => (
                  <div key={b.batch} className="px-6 py-5">
                    <p className="mb-4 flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-muted">
                      <span className="size-1.5 rounded-full bg-blue" />
                      {b.label || `Batch ${b.batch}`}
                    </p>

                    {/* ── Offer type cards ── */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {b.groups.map((g) => {
                        const key = `${yr.year}-${b.batch}-${g.group}`;
                        const isOpen = expanded.has(key);
                        const topPackage = g.students.find((s) => s.money)?.money ?? null;

                        return (
                          <div
                            key={g.group}
                            className="group/card overflow-hidden rounded-xl border-l-[3px] bg-surface-2/30 shadow-[inset_0_0_0_0.5px_var(--line)] transition-all hover:bg-surface-2/50"
                            style={{ borderLeftColor: TINT[g.group] }}
                          >
                            {/* Card header with colored accent */}
                            <div className="px-4 pb-1 pt-4">
                              <div className="flex items-center justify-between">
                                <span
                                  className="text-sm font-bold"
                                  style={{ color: TINT[g.group] }}
                                >
                                  {GROUP_LABEL[g.group]}
                                </span>
                                <span
                                  className="tnum grid size-8 place-items-center rounded-lg text-base font-bold"
                                  style={{
                                    color: TINT[g.group],
                                    backgroundColor: `color-mix(in oklab, ${TINT[g.group]} 14%, transparent)`,
                                  }}
                                >
                                  {g.count}
                                </span>
                              </div>
                            </div>

                            {/* Package highlight */}
                            {topPackage && (
                              <div className="px-4 pb-3 pt-1">
                                <div
                                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
                                  style={{
                                    backgroundColor: `color-mix(in oklab, ${TINT[g.group]} 8%, transparent)`,
                                  }}
                                >
                                  <TrendingUp
                                    size={13}
                                    style={{ color: TINT[g.group] }}
                                  />
                                  <span className="tnum text-sm font-bold text-ink">
                                    {topPackage}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* View students toggle */}
                            <button
                              onClick={() => toggle(key)}
                              className="flex w-full items-center gap-2 border-t border-line/30 px-4 py-2.5 text-xs text-muted transition-colors hover:bg-blue-wash/20 hover:text-blue"
                            >
                              <Users size={13} />
                              <span className="font-medium">
                                {isOpen ? 'Hide' : 'View'} {g.count}{' '}
                                {g.count === 1 ? 'student' : 'students'}
                              </span>
                              <ChevronDown
                                size={13}
                                className={cn(
                                  'ml-auto transition-transform',
                                  isOpen && 'rotate-180',
                                )}
                              />
                            </button>

                            {/* Expanded student list */}
                            {isOpen && (
                              <div className="border-t border-line/30">
                                {g.students.map((s, si) => (
                                  <div
                                    key={si}
                                    className={cn(
                                      'flex items-center justify-between gap-3 px-4 py-2.5 text-xs transition-colors hover:bg-blue-wash/15',
                                      si % 2 === 0
                                        ? 'bg-transparent'
                                        : 'bg-surface-2/20',
                                    )}
                                  >
                                    <span className="min-w-0 flex-1">
                                      <span className="font-semibold text-ink">
                                        {s.name}
                                      </span>
                                      {s.rollNo && (
                                        <span className="tnum ml-2 text-faint">
                                          {s.rollNo}
                                        </span>
                                      )}
                                      {s.branch && (
                                        <span className="ml-1.5 rounded bg-surface-2/60 px-1.5 py-0.5 text-[10px] text-faint">
                                          {s.branch}
                                        </span>
                                      )}
                                      {s.converted && (
                                        <span className="ml-1.5 rounded bg-[color-mix(in_oklab,var(--o-full)_15%,transparent)] px-1.5 py-0.5 text-[10px] font-bold text-o-full">
                                          PPO
                                        </span>
                                      )}
                                      {!s.onCampus && (
                                        <span className="ml-1.5 text-[10px] text-faint">
                                          off-campus
                                        </span>
                                      )}
                                    </span>
                                    {s.money && (
                                      <span className="tnum shrink-0 font-bold text-ink">
                                        {s.money}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
