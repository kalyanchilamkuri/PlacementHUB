'use client';

import { useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteNotice } from '@/lib/actions/admin';

export function DeleteNoticeButton({ id, title }: { id: string; title: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      onClick={() => start(() => void deleteNotice(id))}
      disabled={pending}
      className="grid size-8 shrink-0 place-items-center rounded-lg border border-line text-muted transition-colors hover:border-bad hover:text-bad disabled:opacity-50"
      aria-label={`Take down "${title}"`}
    >
      <Trash2 size={15} />
    </button>
  );
}
