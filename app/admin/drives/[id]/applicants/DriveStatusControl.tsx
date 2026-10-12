'use client';

import { useTransition } from 'react';
import { setDriveStatus } from '@/lib/actions/admin';
import { DRIVE_STATUSES } from '@/lib/types';

const LABEL: Record<string, string> = {
  DRAFT: 'Draft — hidden from students',
  PUBLISHED: 'Published — visible to eligible students',
  CLOSED: 'Closed — no new applications',
  COMPLETED: 'Completed',
};

export function DriveStatusControl({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();

  return (
    <label className="text-sm">
      <span className="mb-1.5 block font-medium">Status</span>
      <select
        value={status}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          start(() => void setDriveStatus(id, next));
        }}
        className="h-10 rounded-[10px] border border-line bg-surface px-3 text-sm focus:border-blue focus:outline-none disabled:opacity-50"
      >
        {DRIVE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {LABEL[s]}
          </option>
        ))}
      </select>
    </label>
  );
}
