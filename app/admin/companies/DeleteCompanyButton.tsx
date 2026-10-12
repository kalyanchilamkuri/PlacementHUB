'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { deleteCompany } from '@/lib/actions/admin';
import { Button } from '@/components/ui/kit';

export function DeleteCompanyButton({
  id,
  name,
  drives,
}: {
  id: string;
  name: string;
  drives: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        className="grid size-9 place-items-center rounded-[10px] border border-line text-muted transition-colors hover:border-bad hover:text-bad"
        aria-label={`Remove ${name}`}
      >
        <Trash2 size={16} />
      </button>

      {confirming && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-[rgb(0_0_0/.55)] p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`del-${id}`}
          onClick={(e) => e.target === e.currentTarget && setConfirming(false)}
        >
          <div className="glass-deep w-full max-w-md rounded-2xl p-6">
            <h2 id={`del-${id}`} className="display text-xl">
              Remove {name}?
            </h2>
            <p className="mt-3 text-sm text-muted">
              {drives > 0
                ? `This also deletes ${drives} ${drives === 1 ? 'drive' : 'drives'} and every application against ${drives === 1 ? 'it' : 'them'}. This cannot be undone.`
                : 'This cannot be undone.'}
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="primary"
                className="flex-1 bg-bad hover:bg-bad"
                disabled={pending}
                onClick={() => start(() => void deleteCompany(id))}
              >
                {pending ? 'Removing' : 'Remove'}
              </Button>
              <Button variant="outline" onClick={() => setConfirming(false)}>
                Keep it
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
