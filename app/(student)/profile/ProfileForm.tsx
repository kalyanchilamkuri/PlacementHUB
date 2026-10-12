'use client';

import { useActionState } from 'react';
import { CircleCheck, Lock } from 'lucide-react';
import { updateMyProfile } from '@/lib/actions/student';
import { Badge, Button, FormError } from '@/components/ui/kit';

type Branch = { code: string; name: string; programme: string };

type Student = {
  rollNo: string | null;
  branchCode: string | null;
  batch: number | null;
  phone: string | null;
  cgpa: number | null;
  tenthPct: number | null;
  twelfthPct: number | null;
  activeBacklogs: number;
  resumeUrl: string | null;
  resumeLabel: string | null;
  verified: boolean;
};

const FIELD =
  'h-10 w-full rounded-[10px] border border-line bg-bg px-3 text-sm placeholder:text-faint focus:border-blue focus:outline-none disabled:opacity-60';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function ProfileForm({
  name,
  email,
  branches,
  student,
}: {
  name: string | null;
  email: string | null;
  branches: Branch[];
  student: Student;
}) {
  const [state, action, pending] = useActionState(updateMyProfile, null);

  return (
    <form action={action} className="mt-8 space-y-5">
      <section className="rounded-2xl border border-line bg-surface p-5 md:p-6">
        <h2 className="font-display text-lg">From your account</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-muted">Name</dt>
            <dd className="mt-0.5 font-medium">{name ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Institute address</dt>
            <dd className="mt-0.5 truncate font-medium">{email}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5 md:p-6">
        <h2 className="font-display text-lg">Who you are</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Roll number">
            <input
              name="rollNo"
              defaultValue={student.rollNo ?? ''}
              className={FIELD}
              placeholder="LCI2023036"
            />
          </Field>
          <Field
            label="Branch"
            hint={branches.length === 0 ? 'No branches exist yet — ask the placement cell.' : undefined}
          >
            <select
              name="branchCode"
              defaultValue={student.branchCode ?? ''}
              className={FIELD}
              disabled={branches.length === 0}
            >
              <option value="">Not set</option>
              {branches.map((b) => (
                <option key={b.code} value={b.code}>
                  {b.programme} — {b.name} ({b.code})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Graduating year">
            <input
              name="batch"
              type="number"
              min="2000"
              max="2100"
              defaultValue={student.batch ?? ''}
              className={FIELD}
              placeholder="2027"
            />
          </Field>
          <Field label="Phone">
            <input
              name="phone"
              type="tel"
              defaultValue={student.phone ?? ''}
              className={FIELD}
              placeholder="Only the placement cell sees this"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg">Academics</h2>
          {student.verified ? (
            <Badge tone="ok">
              <CircleCheck size={12} />
              Verified and locked
            </Badge>
          ) : (
            <Badge tone="neutral">Not yet verified</Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted">
          {student.verified
            ? 'The placement cell has checked these against the registry, so they can no longer be edited here.'
            : 'Drives compare these against their eligibility rules. The cell verifies them later.'}
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <Field label="CGPA">
            <input
              name="cgpa"
              type="number"
              step="0.01"
              min="0"
              max="10"
              defaultValue={student.cgpa ?? ''}
              disabled={student.verified}
              className={FIELD}
            />
          </Field>
          <Field label="Class 10 %">
            <input
              name="tenthPct"
              type="number"
              step="0.1"
              min="0"
              max="100"
              defaultValue={student.tenthPct ?? ''}
              disabled={student.verified}
              className={FIELD}
            />
          </Field>
          <Field label="Class 12 %">
            <input
              name="twelfthPct"
              type="number"
              step="0.1"
              min="0"
              max="100"
              defaultValue={student.twelfthPct ?? ''}
              disabled={student.verified}
              className={FIELD}
            />
          </Field>
          <Field label="Active backlogs">
            <input
              name="activeBacklogs"
              type="number"
              min="0"
              defaultValue={student.activeBacklogs}
              disabled={student.verified}
              className={FIELD}
            />
          </Field>
        </div>

        {student.verified && (
          <p className="mt-4 flex items-center gap-2 text-xs text-muted">
            <Lock size={13} />
            Ask the placement cell if something here is wrong.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5 md:p-6">
        <h2 className="font-display text-lg">Resume</h2>
        <p className="mt-1 text-sm text-muted">
          Paste a link the placement cell and recruiters can open, for example a Drive share link
          set to anyone with the link.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_200px]">
          <Field label="Resume link">
            <input
              name="resumeUrl"
              type="url"
              defaultValue={student.resumeUrl ?? ''}
              className={FIELD}
              placeholder="https://"
            />
          </Field>
          <Field label="Label" hint="For example SDE or Data.">
            <input
              name="resumeLabel"
              defaultValue={student.resumeLabel ?? ''}
              className={FIELD}
              placeholder="SDE"
            />
          </Field>
        </div>
      </section>

      {state && !state.ok && <FormError>{state.error}</FormError>}
      {state?.ok && (
        <p role="status" className="rounded-xl border border-ok/30 bg-trace-wash px-4 py-2.5 text-sm text-ok">
          Profile saved.
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? 'Saving' : 'Save profile'}
      </Button>
    </form>
  );
}
