'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteBranch } from '@/lib/actions/admin';

export function DeleteBranchButton({ code, inUse }: { code: string; inUse: boolean }) {
  const [pending, start] = useTransition();

  if (inUse) {
    return (
      <span className="text-xs text-faint" title="Students are on this branch">
        In use
      </span>
    );
  }

  return (
    <button
      onClick={() => start(() => void deleteBranch(code))}
      disabled={pending}
      className="grid size-8 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-bad hover:text-bad disabled:opacity-50"
      aria-label={`Remove ${code}`}
    >
      <Trash2 size={15} />
    </button>
  );
}
