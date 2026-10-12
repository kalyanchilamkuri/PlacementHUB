'use client';

import { useActionState } from 'react';
import { changeMyPassword } from '@/lib/actions/student';
import { PASSWORD_RULE } from '@/lib/password-rules';
import { Button, FormError } from '@/components/ui/kit';

const FIELD =
  'h-10 w-full rounded-[10px] border border-line bg-bg px-3 text-sm focus:border-blue focus:outline-none';

export function ChangePassword({ mustChange }: { mustChange: boolean }) {
  const [state, action, pending] = useActionState(changeMyPassword, null);

  return (
    <form
      action={action}
      className={`rounded-2xl border bg-surface p-5 md:p-6 ${
        mustChange ? 'border-warn/40' : 'border-line'
      }`}
    >
      <h2 className="font-display text-lg">Password</h2>
      <p className="mt-1 text-sm text-muted">
        {mustChange
          ? 'The placement cell set a temporary password for you. Choose your own now.'
          : 'Change it whenever you like.'}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Current password</span>
          <input
            name="current"
            type="password"
            autoComplete="current-password"
            required
            className={FIELD}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">New password</span>
          <input
            name="next"
            type="password"
            autoComplete="new-password"
            required
            className={FIELD}
          />
          <span className="mt-1 block text-xs text-muted">{PASSWORD_RULE}</span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">New password again</span>
          <input
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            className={FIELD}
          />
        </label>
      </div>

      {state && !state.ok && (
        <div className="mt-4">
          <FormError>{state.error}</FormError>
        </div>
      )}
      {state?.ok && (
        <p
          role="status"
          className="mt-4 rounded-xl border border-ok/30 bg-trace-wash px-4 py-2.5 text-sm text-ok"
        >
          Password changed.
        </p>
      )}

      <Button type="submit" variant="secondary" className="mt-5" disabled={pending}>
        {pending ? 'Saving' : 'Change password'}
      </Button>
    </form>
  );
}
