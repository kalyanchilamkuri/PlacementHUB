'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Building2, CheckCircle2, Loader2, Search, UserRound } from 'lucide-react';
import { lookupStudent, recordOffCampusOffer, recordOffer } from '@/lib/actions/offers';
import { DRIVE_TYPE_TO_OFFER_TYPE, OFFER_TYPES, OFFER_TYPE_LABEL } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button, FormError } from '@/components/ui/kit';

type DriveOpt = { id: string; label: string; type: string };
type Found = { name: string; email: string; branchCode: string | null; cgpa: number | null; offers: number };

const FIELD =
  'h-11 w-full rounded-[10px] border border-line bg-bg px-3 text-sm placeholder:text-faint focus:border-blue focus:outline-none';

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="flex gap-4">
      <span className="niche mt-0.5 grid size-8 shrink-0 place-items-center border border-line bg-blue-wash text-sm font-medium text-blue">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-medium">{title}</h2>
        <div className="mt-3 space-y-3">{children}</div>
      </div>
    </section>
  );
}

function StudentLookup() {
  const [roll, setRoll] = useState('');
  const [found, setFound] = useState<Found | null>(null);
  const [busy, setBusy] = useState(false);
  const seq = useRef(0);

  const q = roll.trim();
  const ready = q.length >= 3;

  useEffect(() => {
    if (!ready) return;
    const mine = ++seq.current;
    const t = setTimeout(async () => {
      setBusy(true);
      const r = await lookupStudent(q);
      if (mine !== seq.current) return;
      setFound(r);
      setBusy(false);
    }, 300);
    return () => clearTimeout(t);
  }, [q, ready]);

  return (
    <div>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-3.5 text-faint" />
        <input
          name="rollNo"
          value={roll}
          onChange={(e) => setRoll(e.target.value)}
          placeholder="Type the roll number"
          autoComplete="off"
          required
          className={cn(FIELD, 'pl-9')}
        />
        {busy && <Loader2 size={16} className="absolute right-3 top-3.5 animate-spin text-faint" />}
      </div>
      {ready && found && (
        <div className="pop mt-3 flex items-center gap-3 rounded-xl border border-ok/30 bg-trace-wash p-3">
          <span className="niche grid size-10 place-items-center border border-ok/30 bg-surface text-ok">
            <UserRound size={18} />
          </span>
          <div className="min-w-0 text-sm">
            <p className="font-medium">{found.name}</p>
            <p className="truncate text-xs text-muted">
              {[found.branchCode, found.cgpa && `CGPA ${found.cgpa}`, found.email].filter(Boolean).join('  ·  ')}
              {found.offers > 0 && `  ·  already has ${found.offers} offer${found.offers === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>
      )}
      {ready && !found && !busy && (
        <p className="mt-2 text-xs text-bad">No student has that roll number yet.</p>
      )}
    </div>
  );
}

function OfferFields({ defaultType }: { defaultType?: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="block sm:col-span-1">
        <span className="mb-1.5 block text-xs text-muted">Offer type</span>
        <select name="offerType" key={defaultType} defaultValue={defaultType ?? 'FULL_TIME'} className={FIELD}>
          {OFFER_TYPES.map((t) => (
            <option key={t} value={t}>
              {OFFER_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs text-muted">Package (LPA)</span>
        <input name="ctcLpa" type="number" step="0.01" min="0" defaultValue="0" required className={FIELD} />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs text-muted">Stipend per month (optional)</span>
        <input name="stipend" type="number" min="0" placeholder="₹" className={FIELD} />
      </label>
    </div>
  );
}

function Outcome({ state }: { state: { ok: true; message: string } | { ok: false; error: string } | null }) {
  if (!state) return null;
  if (!state.ok) return <FormError>{state.error}</FormError>;
  return (
    <p
      role="status"
      className="pop flex items-start gap-2 rounded-xl border border-ok/30 bg-trace-wash px-4 py-3 text-sm text-ok"
    >
      <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
      <span>
        {state.message} The student&apos;s tracker, the placements page, the timeline and the analytics
        are all updated.
      </span>
    </p>
  );
}

export function RecordOfferForm({ drives, companies }: { drives: DriveOpt[]; companies: string[] }) {
  const [tab, setTab] = useState<'on' | 'off'>('on');
  const [onState, onAction, onPending] = useActionState(recordOffer, null);
  const [offState, offAction, offPending] = useActionState(recordOffCampusOffer, null);
  const [driveType, setDriveType] = useState<string | undefined>();

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-lift)] md:p-7">
      <div className="inline-flex rounded-xl border border-line bg-surface-2 p-1" role="tablist">
        {(
          [
            ['on', 'Campus drive'],
            ['off', 'Off-campus'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            type="button"
            onClick={() => setTab(k)}
            className={cn(
              'rounded-lg px-4 py-1.5 text-sm transition-colors',
              tab === k ? 'bg-surface font-medium text-blue shadow-[var(--shadow-lift)]' : 'text-muted hover:text-ink',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'on' ? (
        <form action={onAction} className="mt-6 space-y-6">
          <Step n={1} title="Who got it?">
            <StudentLookup />
          </Step>
          <Step n={2} title="Which drive?">
            <select
              name="driveId"
              required
              defaultValue=""
              onChange={(e) => {
                const d = drives.find((x) => x.id === e.target.value);
                setDriveType(d ? DRIVE_TYPE_TO_OFFER_TYPE[d.type] : undefined);
              }}
              className={FIELD}
            >
              <option value="" disabled>
                Choose a company drive
              </option>
              {drives.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
            {drives.length === 0 && (
              <p className="text-xs text-muted">No drives yet. Create one first, or use the Off-campus tab.</p>
            )}
          </Step>
          <Step n={3} title="What was offered?">
            <OfferFields defaultType={driveType} />
          </Step>
          <Outcome state={onState} />
          <Button type="submit" size="lg" disabled={onPending} className="w-full sm:w-auto">
            {onPending ? 'Saving…' : 'Record offer'}
          </Button>
        </form>
      ) : (
        <form action={offAction} className="mt-6 space-y-6">
          <Step n={1} title="Who got it?">
            <StudentLookup />
          </Step>
          <Step n={2} title="Which company?">
            <div className="relative">
              <Building2 size={16} className="pointer-events-none absolute left-3 top-3.5 text-faint" />
              <input
                name="companyName"
                list="company-list"
                required
                placeholder="Company name"
                className={cn(FIELD, 'pl-9')}
              />
              <datalist id="company-list">
                {companies.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="role" placeholder="Role (optional)" className={FIELD} />
              <input
                name="academicYear"
                required
                placeholder="Academic year, e.g. 2025-26"
                pattern="\d{4}-\d{2}"
                className={FIELD}
              />
            </div>
          </Step>
          <Step n={3} title="What was offered?">
            <OfferFields />
          </Step>
          <Outcome state={offState} />
          <Button type="submit" size="lg" disabled={offPending} className="w-full sm:w-auto">
            {offPending ? 'Saving…' : 'Record off-campus offer'}
          </Button>
        </form>
      )}
    </div>
  );
}
