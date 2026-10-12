'use client';

import { useTransition } from 'react';
import { Trash2, TrendingUp } from 'lucide-react';
import { convertToPPO, deleteOffer } from '@/lib/actions/offers';

export function RecentOfferActions({ id, canPpo }: { id: string; canPpo: boolean }) {
  const [pending, start] = useTransition();
  return (
    <span className="flex shrink-0 items-center gap-1">
      {canPpo && (
        <button
          type="button"
          disabled={pending}
          onClick={() => start(() => convertToPPO(id))}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-o-ppo disabled:opacity-50"
          title="Convert this internship to a PPO"
        >
          <TrendingUp size={14} /> PPO
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        aria-label="Delete offer"
        onClick={() => {
          if (confirm('Remove this offer? The student will no longer count as placed by it.'))
            start(() => deleteOffer(id));
        }}
        className="grid size-8 place-items-center rounded-lg text-faint transition-colors hover:bg-surface-2 hover:text-bad disabled:opacity-50"
      >
        <Trash2 size={14} />
      </button>
    </span>
  );
}
