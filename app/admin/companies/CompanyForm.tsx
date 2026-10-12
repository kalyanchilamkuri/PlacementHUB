'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createCompany } from '@/lib/actions/admin';
import { Button, FormError } from '@/components/ui/kit';

const FIELD =
  'h-10 w-full rounded-[10px] border border-line bg-bg px-3 text-sm placeholder:text-faint focus:border-blue focus:outline-none';

export function CompanyForm() {
  const [state, action, pending] = useActionState(createCompany, null);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) form.current?.reset();
  }, [state]);

  return (
    <form
      ref={form}
      action={action}
      className="rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-[76px]"
    >
      <h2 className="font-semibold">Add a company</h2>

      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Name</span>
          <input name="name" required className={FIELD} placeholder="Acme Systems" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Sector</span>
          <input name="sector" className={FIELD} placeholder="Software" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Head office</span>
          <input name="hq" className={FIELD} placeholder="Bengaluru" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Website</span>
          <input name="website" type="url" className={FIELD} placeholder="https://" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Notes</span>
          <textarea
            name="description"
            rows={3}
            className="w-full rounded-[10px] border border-line bg-bg p-3 text-sm placeholder:text-faint focus:border-blue focus:outline-none"
            placeholder="Anything the cell should remember about them."
          />
        </label>
      </div>

      {state && !state.ok && (
        <div className="mt-4">
          <FormError>{state.error}</FormError>
        </div>
      )}

      <Button type="submit" className="mt-5 w-full" disabled={pending}>
        {pending ? 'Saving' : 'Add company'}
      </Button>
    </form>
  );
}
