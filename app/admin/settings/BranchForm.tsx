'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createBranch } from '@/lib/actions/admin';
import { Button, FormError } from '@/components/ui/kit';

const FIELD =
  'h-10 w-full rounded-[10px] border border-line bg-bg px-3 text-sm placeholder:text-faint focus:border-blue focus:outline-none';

export function BranchForm() {
  const [state, action, pending] = useActionState(createBranch, null);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);

  return (
    <form ref={form} action={action} className="rounded-2xl border border-line bg-surface p-5">
      <h3 className="font-semibold">Add a branch</h3>
      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Short code</span>
          <input name="code" required className={FIELD} placeholder="CSE" maxLength={12} />
          <span className="mt-1 block text-xs text-muted">Shown on drive cards and tables.</span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Full name</span>
          <input
            name="name"
            required
            className={FIELD}
            placeholder="Computer Science & Engineering"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Programme</span>
          <input name="programme" required className={FIELD} placeholder="B.Tech" />
        </label>
      </div>

      {state && !state.ok && (
        <div className="mt-4">
          <FormError>{state.error}</FormError>
        </div>
      )}

      <Button type="submit" className="mt-5 w-full" disabled={pending}>
        {pending ? 'Saving' : 'Add branch'}
      </Button>
    </form>
  );
}
