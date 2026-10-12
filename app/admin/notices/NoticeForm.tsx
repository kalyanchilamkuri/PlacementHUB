'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createNotice } from '@/lib/actions/admin';
import { Button, FormError } from '@/components/ui/kit';

type Branch = { code: string; name: string };

const FIELD =
  'h-10 w-full rounded-[10px] border border-line bg-bg px-3 text-sm placeholder:text-faint focus:border-blue focus:outline-none';

export function NoticeForm({ branches }: { branches: Branch[] }) {
  const [state, action, pending] = useActionState(createNotice, null);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);

  return (
    <form ref={form} action={action} className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-semibold">Post a notice</h2>
      <p className="mt-1 text-sm text-muted">
        Everyone it targets gets a notification straight away.
      </p>

      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Title</span>
          <input
            name="title"
            required
            className={FIELD}
            placeholder="Rubrik drive closes tomorrow"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">What you want to say</span>
          <textarea
            name="body"
            rows={4}
            required
            className="w-full rounded-[10px] border border-line bg-bg p-3 text-sm placeholder:text-faint focus:border-blue focus:outline-none"
            placeholder="Registration will not be reopened. Confirm your resume before you apply."
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Priority</span>
          <select name="priority" className={FIELD} defaultValue="NORMAL">
            <option value="NORMAL">Normal</option>
            <option value="URGENT">Urgent — shown first, marked in red</option>
          </select>
        </label>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Who sees it</legend>
          {branches.length === 0 ? (
            <p className="text-xs text-muted">
              No branches exist yet, so this goes to every student.
            </p>
          ) : (
            <>
              <p className="mb-2 text-xs text-muted">
                Leave all unticked to send it to everyone.
              </p>
              <ul className="flex flex-wrap gap-2">
                {branches.map((b) => (
                  <li key={b.code}>
                    <label className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm text-muted has-[:checked]:border-blue has-[:checked]:bg-blue-wash has-[:checked]:text-blue">
                      <input
                        type="checkbox"
                        name="branchCodes"
                        value={b.code}
                        className="size-3.5 accent-[var(--blue)]"
                      />
                      {b.code}
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}
        </fieldset>
      </div>

      {state && !state.ok && (
        <div className="mt-4">
          <FormError>{state.error}</FormError>
        </div>
      )}

      <Button type="submit" className="mt-5 w-full" disabled={pending}>
        {pending ? 'Posting' : 'Post notice'}
      </Button>
    </form>
  );
}
