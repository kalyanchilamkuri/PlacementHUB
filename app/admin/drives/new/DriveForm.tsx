'use client';

import { useActionState, useMemo, useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { createDrive } from '@/lib/actions/admin';
import { DRIVE_TYPES, ROUND_TYPES, ROUND_TYPE_LABEL, type RoundType } from '@/lib/types';
import { Button, FormError } from '@/components/ui/kit';

type Company = { id: string; name: string };
type Branch = { code: string; name: string; programme: string; students: number };
type Round = { key: number; name: string; type: RoundType; startsAt: string; venue: string };

const FIELD =
  'h-10 w-full rounded-[10px] border border-line bg-bg px-3 text-sm placeholder:text-faint focus:border-blue focus:outline-none';

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

function Fieldset({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-2xl border border-line bg-surface p-5 md:p-6">
      <legend className="px-2 font-display text-lg">{title}</legend>
      {lead && <p className="mb-4 text-sm text-muted">{lead}</p>}
      {children}
    </fieldset>
  );
}

export function DriveForm({ companies, branches }: { companies: Company[]; branches: Branch[] }) {
  const [state, action, pending] = useActionState(createDrive, null);
  const [picked, setPicked] = useState<string[]>([]);
  const [rounds, setRounds] = useState<Round[]>([
    { key: 1, name: 'Online assessment', type: 'OA', startsAt: '', venue: '' },
  ]);

  // Live counter: empty selection means every branch is eligible.
  const reach = useMemo(() => {
    const pool = picked.length === 0 ? branches : branches.filter((b) => picked.includes(b.code));
    return pool.reduce((total, b) => total + b.students, 0);
  }, [picked, branches]);

  const toggleBranch = (code: string) =>
    setPicked((p) => (p.includes(code) ? p.filter((c) => c !== code) : [...p, code]));

  return (
    <form action={action} className="mt-8 space-y-5">
      <Fieldset title="The role">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company">
            <select name="companyId" required className={FIELD} defaultValue="">
              <option value="" disabled>
                Choose a company
              </option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Role">
            <input name="role" required className={FIELD} placeholder="Software Engineer" />
          </Field>
          <Field label="Type">
            <select name="type" className={FIELD} defaultValue="Full-time">
              {DRIVE_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Locations" hint="Comma separated.">
            <input name="locations" className={FIELD} placeholder="Bengaluru, Hyderabad" />
          </Field>
          <Field label="Package" hint="In lakhs per annum.">
            <input name="ctcLpa" type="number" step="0.1" min="0" className={FIELD} placeholder="18" />
          </Field>
          <Field label="Stipend" hint="Rupees per month, for internships.">
            <input name="stipend" type="number" min="0" className={FIELD} placeholder="50000" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Job description">
            <textarea
              name="jdText"
              rows={4}
              className="w-full rounded-[10px] border border-line bg-bg p-3 text-sm placeholder:text-faint focus:border-blue focus:outline-none"
              placeholder="What the role involves, as the company described it."
            />
          </Field>
        </div>
      </Fieldset>

      <Fieldset title="Who can apply" lead="Leave every branch unticked to open it to all of them.">
        {branches.length === 0 ? (
          <p className="rounded-xl border border-warn/30 bg-arch-wash px-4 py-3 text-sm text-warn">
            No branches exist yet. Add them in Settings, or this drive will be open to nobody.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {branches.map((b) => {
              const on = picked.includes(b.code);
              return (
                <li key={b.code}>
                  <label
                    className={`flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                      on ? 'border-blue bg-blue-wash text-blue' : 'border-line text-muted'
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="branchCodes"
                      value={b.code}
                      checked={on}
                      onChange={() => toggleBranch(b.code)}
                      className="size-3.5 accent-[var(--blue)]"
                    />
                    {b.code}
                    <span className="tnum text-xs opacity-70">{b.students}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-4">
          <Field label="Minimum CGPA">
            <input name="minCgpa" type="number" step="0.1" min="0" max="10" className={FIELD} placeholder="0" />
          </Field>
          <Field label="Active backlogs allowed">
            <input name="maxBacklogs" type="number" min="0" className={FIELD} placeholder="0" />
          </Field>
          <Field label="Class 10 minimum %">
            <input name="minTenthPct" type="number" step="0.1" min="0" max="100" className={FIELD} />
          </Field>
          <Field label="Class 12 minimum %">
            <input name="minTwelfthPct" type="number" step="0.1" min="0" max="100" className={FIELD} />
          </Field>
        </div>

        <p className="mt-5 flex items-center gap-2.5 rounded-xl bg-blue-wash px-4 py-3 text-sm">
          <Users size={16} className="text-blue" />
          <span>
            <span className="tnum font-semibold">{reach}</span>{' '}
            {reach === 1 ? 'student is' : 'students are'} on the selected branches. The CGPA and
            backlog rules are applied per student when they open the drive.
          </span>
        </p>
      </Fieldset>

      <Fieldset title="Rounds" lead="These fill the calendar. Dates can be added later.">
        <input type="hidden" name="rounds" value={JSON.stringify(rounds)} />
        <ol className="space-y-3">
          {rounds.map((r, i) => (
            <li key={r.key} className="rounded-xl border border-line p-4">
              <div className="flex items-center gap-3">
                <span className="tnum grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold">
                  {i + 1}
                </span>
                <span className="text-sm font-medium">Round {i + 1}</span>
                {rounds.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setRounds((rs) => rs.filter((x) => x.key !== r.key))}
                    className="ml-auto grid size-8 place-items-center rounded-lg border border-line text-muted hover:border-bad hover:text-bad"
                    aria-label={`Remove round ${i + 1}`}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <input
                    value={r.name}
                    onChange={(e) =>
                      setRounds((rs) =>
                        rs.map((x) => (x.key === r.key ? { ...x, name: e.target.value } : x)),
                      )
                    }
                    className={FIELD}
                    placeholder="Technical interview"
                  />
                </Field>
                <Field label="Kind">
                  <select
                    value={r.type}
                    onChange={(e) =>
                      setRounds((rs) =>
                        rs.map((x) =>
                          x.key === r.key ? { ...x, type: e.target.value as RoundType } : x,
                        ),
                      )
                    }
                    className={FIELD}
                  >
                    {ROUND_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {ROUND_TYPE_LABEL[t]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Date and time">
                  <input
                    type="datetime-local"
                    value={r.startsAt}
                    onChange={(e) =>
                      setRounds((rs) =>
                        rs.map((x) => (x.key === r.key ? { ...x, startsAt: e.target.value } : x)),
                      )
                    }
                    className={FIELD}
                  />
                </Field>
                <Field label="Venue or link">
                  <input
                    value={r.venue}
                    onChange={(e) =>
                      setRounds((rs) =>
                        rs.map((x) => (x.key === r.key ? { ...x, venue: e.target.value } : x)),
                      )
                    }
                    className={FIELD}
                    placeholder="Lab 204, or a meeting link"
                  />
                </Field>
              </div>
            </li>
          ))}
        </ol>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() =>
            setRounds((rs) => [
              ...rs,
              { key: Date.now(), name: '', type: 'TECH', startsAt: '', venue: '' },
            ])
          }
        >
          <Plus size={15} />
          Add a round
        </Button>
      </Fieldset>

      <Fieldset title="Closing">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Applications close" hint="Students cannot apply after this moment.">
            <input name="deadline" type="datetime-local" required className={FIELD} />
          </Field>
          <Field label="Academic year" hint="For example 2026-27.">
            <input name="academicYear" className={FIELD} placeholder="2026-27" />
          </Field>
          <Field label="Which students" hint="3rd year hires interns; 4th year hires winter interns and full-timers.">
            <select name="yearOfStudy" className={FIELD} defaultValue="4">
              <option value="3">3rd year (internships)</option>
              <option value="4">4th year (winter / full-time)</option>
            </select>
          </Field>
        </div>
      </Fieldset>

      {state && !state.ok && <FormError>{state.error}</FormError>}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" name="publish" value="yes" size="lg" disabled={pending}>
          {pending ? 'Saving' : 'Publish drive'}
        </Button>
        <Button type="submit" name="publish" value="no" size="lg" variant="outline" disabled={pending}>
          Save as draft
        </Button>
      </div>
    </form>
  );
}
