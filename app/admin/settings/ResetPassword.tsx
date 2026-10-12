'use client';

import { useActionState, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { resetUserPassword } from '@/lib/actions/admin';
import { PASSWORD_RULE } from '@/lib/password-rules';
import { Button, FormError } from '@/components/ui/kit';

export function ResetPassword({ userId, email }: { userId: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(resetUserPassword, null);
  const done = state?.ok === true;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-line px-3 py-1 text-xs text-muted transition-colors hover:border-blue hover:text-blue"
      >
        <KeyRound size={11} className="mr-1 inline" />
        Reset password
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-[rgb(0_0_0/.55)] p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`reset-${userId}`}
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <form action={action} className="glass-deep w-full max-w-md rounded-2xl p-6">
            <input type="hidden" name="userId" value={userId} />

            <h2 id={`reset-${userId}`} className="display text-xl">
              Reset password
            </h2>
            <p className="mt-2 break-all text-sm text-muted">{email}</p>
            {done ? (
              <>
                <p className="mt-3 rounded-xl border border-ok/30 bg-trace-wash px-4 py-3 text-sm text-ok">
                  Password set. Pass it to them in person — they will be asked to choose their own
                  the next time they sign in.
                </p>
                <Button
                  type="button"
                  className="mt-6 w-full"
                  onClick={() => setOpen(false)}
                >
                  Done
                </Button>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm text-muted">
                  Set a temporary password and tell them in person. They will be asked to change
                  it the next time they sign in.
                </p>

                <label className="mt-5 block">
                  <span className="mb-1.5 block text-sm font-medium">Temporary password</span>
                  <input
                    name="password"
                    type="text"
                    required
                    autoComplete="off"
                    className="h-11 w-full rounded-[10px] border border-line bg-bg px-3 text-sm focus:border-blue focus:outline-none"
                  />
                  <span className="mt-1 block text-xs text-muted">{PASSWORD_RULE}</span>
                </label>

                {state && !state.ok && (
                  <div className="mt-4">
                    <FormError>{state.error}</FormError>
                  </div>
                )}

                <div className="mt-6 flex gap-3">
                  <Button type="submit" className="flex-1" disabled={pending}>
                    {pending ? 'Saving' : 'Set password'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
      )}
    </>
  );
}
