'use client';

import { useState, useTransition } from 'react';
import { Check, Lock } from 'lucide-react';
import { applyToDrive, withdrawApplication } from '@/lib/actions/student';
import { longDate } from '@/lib/utils';
import { Button, FormError } from '@/components/ui/kit';
import { Deadline } from '@/components/app/Deadline';

export function ApplyPanel({
  driveId,
  deadline,
  closed,
  eligible,
  reason,
  applied,
  hasResume,
}: {
  driveId: string;
  deadline: string;
  closed: boolean;
  eligible: boolean;
  reason: string | null;
  applied: boolean;
  hasResume: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [isApplied, setIsApplied] = useState(applied);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () =>
    start(async () => {
      const result = await applyToDrive(driveId);
      if (result.ok) {
        setIsApplied(true);
        setConfirming(false);
        setError(null);
      } else {
        setError(result.error);
        setConfirming(false);
      }
    });

  const withdraw = () =>
    start(async () => {
      const result = await withdrawApplication(driveId);
      if (result.ok) setIsApplied(false);
      else setError(result.error);
    });

  return (
    <>
      <aside className="glass sticky top-[76px] rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted">Applications close</span>
          <Deadline iso={deadline} />
        </div>
        <p className="tnum mt-1 text-sm">{longDate(deadline)}</p>

        <hr className="my-5" />

        {isApplied ? (
          <div className="text-center">
            <span className="niche mx-auto grid size-11 place-items-center border border-ok/30 bg-trace-wash text-ok">
              <Check size={20} />
            </span>
            <p className="mt-3 font-medium">Application in</p>
            <p className="mt-1 text-sm text-muted">
              Your tracker updates as the cell records each round.
            </p>
            <Button href="/applications" variant="outline" size="sm" className="mt-4 w-full">
              Track it
            </Button>
            <button
              onClick={withdraw}
              disabled={pending}
              className="mt-3 text-xs text-muted underline hover:text-bad disabled:opacity-50"
            >
              Withdraw this application
            </button>
          </div>
        ) : closed ? (
          <div className="text-center">
            <span className="niche mx-auto grid size-11 place-items-center border border-line bg-surface-2 text-muted">
              <Lock size={18} />
            </span>
            <p className="mt-3 font-medium">Not accepting applications</p>
            <p className="mt-1.5 text-sm text-muted">This drive is no longer open.</p>
          </div>
        ) : eligible ? (
          <>
            {!hasResume && (
              <p className="mb-4 rounded-xl border border-warn/30 bg-arch-wash px-3.5 py-2.5 text-xs text-warn">
                You have no resume link on your profile. You can still apply, but add one so the
                company can read it.
              </p>
            )}
            <Button size="lg" className="w-full" disabled={pending} onClick={() => setConfirming(true)}>
              Apply
            </Button>
            <p className="mt-3 text-xs text-muted">
              You can withdraw any time before the deadline.
            </p>
          </>
        ) : (
          <div>
            <span className="niche mx-auto grid size-11 place-items-center border border-line bg-surface-2 text-muted">
              <Lock size={18} />
            </span>
            <p className="mt-3 text-center font-medium">You cannot apply</p>
            <p className="mt-1.5 text-center text-sm text-bad">{reason}</p>
            <p className="mt-3 text-center text-xs text-muted">
              Eligibility comes from your profile. Ask the cell if a verified field is wrong.
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4">
            <FormError>{error}</FormError>
          </div>
        )}
      </aside>

      {confirming && (
        <div
          className="fixed inset-0 z-[60] grid place-items-center bg-[rgb(0_0_0/.55)] p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-apply"
          onClick={(e) => e.target === e.currentTarget && setConfirming(false)}
        >
          <div className="glass-deep w-full max-w-md rounded-2xl p-6">
            <h2 id="confirm-apply" className="display text-xl">
              Confirm your application
            </h2>
            <p className="mt-3 text-sm text-muted">
              Applying is a commitment to attend every round you are called to. You can withdraw
              before {longDate(deadline)}.
            </p>
            <div className="mt-6 flex gap-3">
              <Button className="flex-1" disabled={pending} onClick={submit}>
                {pending ? 'Applying' : 'Apply now'}
              </Button>
              <Button variant="outline" onClick={() => setConfirming(false)}>
                Go back
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
