'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { VisibleDrive } from '@/lib/queries';
import { DriveCard } from '@/components/app/DriveCard';

export function DrivesBrowser({ list }: { list: VisibleDrive[] }) {
  const [q, setQ] = useState('');
  const [onlyEligible, setOnlyEligible] = useState(false);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return list
      .filter((v) => !onlyEligible || v.eligibility.eligible)
      .filter(
        (v) =>
          !needle ||
          v.drive.company.name.toLowerCase().includes(needle) ||
          v.drive.role.toLowerCase().includes(needle),
      );
  }, [list, q, onlyEligible]);

  return (
    <>
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <label className="relative flex-1 sm:max-w-xs">
          <span className="sr-only">Search drives</span>
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Company or role"
            className="h-10 w-full rounded-[10px] border border-line bg-surface pl-9 pr-3 text-sm placeholder:text-faint focus:border-blue focus:outline-none"
          />
        </label>

        <label className="flex h-10 cursor-pointer items-center gap-2.5 rounded-[10px] border border-line bg-surface px-3.5 text-sm">
          <input
            type="checkbox"
            checked={onlyEligible}
            onChange={(e) => setOnlyEligible(e.target.checked)}
            className="size-4 accent-[var(--blue)]"
          />
          Only what I qualify for
        </label>
      </div>

      <p className="mt-4 text-sm text-muted" role="status">
        {shown.length} {shown.length === 1 ? 'drive' : 'drives'}
      </p>

      {shown.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line px-6 py-14 text-center">
          <p className="font-medium">Nothing matches that.</p>
          <p className="mt-1 text-sm text-muted">Clear the search or untick the filter.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {shown.map((v) => (
            <li key={v.drive.id}>
              <DriveCard drive={v.drive} eligibility={v.eligibility} applied={v.applied} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
