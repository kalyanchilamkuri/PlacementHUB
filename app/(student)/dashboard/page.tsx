import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, CalendarClock, Sparkles } from 'lucide-react';
import { requireStudent } from '@/lib/dal';
import { db } from '@/lib/db';
import { openToApply, visibleDrives } from '@/lib/queries';
import { syncDeadlineNotifications } from '@/lib/notify';
import { longDate, shortDate } from '@/lib/utils';
import { STAGE_LABEL, type Stage } from '@/lib/types';
import { Badge, Button, EmptyState } from '@/components/ui/kit';
import { DriveCard } from '@/components/app/DriveCard';
import { Stepper } from '@/components/app/Stepper';

export const metadata: Metadata = { title: 'Dashboard' };

/** How much of the profile is filled in, as a share of the fields drives read. */
function completeness(s: {
  rollNo: string | null;
  branchCode: string | null;
  batch: number | null;
  phone: string | null;
  cgpa: number | null;
  tenthPct: number | null;
  twelfthPct: number | null;
  resumeUrl: string | null;
}) {
  const fields = [
    ['Roll number', s.rollNo],
    ['Branch', s.branchCode],
    ['Graduation year', s.batch],
    ['Phone', s.phone],
    ['CGPA', s.cgpa],
    ['Class 10 marks', s.tenthPct],
    ['Class 12 marks', s.twelfthPct],
    ['Resume', s.resumeUrl],
  ] as const;
  const missing = fields.filter(([, v]) => v === null || v === '').map(([k]) => k);
  return { pct: Math.round(((fields.length - missing.length) / fields.length) * 100), missing };
}

export default async function DashboardPage() {
  const { name, student, userId } = await requireStudent();

  // No job runner, so deadline reminders are computed when the student looks.
  // The dedupe key makes this idempotent across reloads.
  await syncDeadlineNotifications({ ...student, userId });

  const [all, applications, notices] = await Promise.all([
    visibleDrives(student),
    db.application.findMany({
      where: { studentId: student.id },
      orderBy: { appliedAt: 'desc' },
      include: {
        results: { select: { roundId: true, result: true } },
        drive: {
          include: {
            company: { select: { name: true } },
            rounds: { orderBy: { order: 'asc' } },
          },
        },
      },
    }),
    db.notice.findMany({
      where: {
        OR: [
          { branchCodes: '' },
          ...(student.branchCode ? [{ branchCodes: { contains: student.branchCode } }] : []),
        ],
      },
      orderBy: [{ priority: 'asc' }, { publishedAt: 'desc' }],
      take: 3,
    }),
  ]);

  const open = openToApply(all);
  const profile = completeness(student);
  const live = applications.filter((a) => a.stage !== 'REJECTED').length;

  const upcoming = applications
    .flatMap((a) =>
      a.drive.rounds
        .filter((r) => r.startsAt && r.startsAt.getTime() > Date.now())
        .map((r) => ({
          key: r.id,
          company: a.drive.company.name,
          name: r.name,
          at: r.startsAt!.toISOString(),
          venue: r.venue,
          driveId: a.drive.id,
        })),
    )
    .sort((a, b) => +new Date(a.at) - +new Date(b.at))
    .slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-9">
      <section className="glass rounded-2xl p-6">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="display text-[clamp(1.6rem,3.4vw,2.2rem)]">{name ?? 'Welcome'}</h1>
            <p className="tnum mt-1 text-sm text-muted">
              {[student.rollNo, student.branch?.code, student.batch && `batch ${student.batch}`]
                .filter(Boolean)
                .join(', ') || 'Fill in your profile to start applying'}
            </p>
            {student.verified && (
              <div className="mt-3">
                <Badge tone="ok">Academics verified</Badge>
              </div>
            )}
          </div>

          <div className="w-full max-w-xs">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium">Profile</span>
              <span className="tnum text-muted">{profile.pct}% complete</span>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-surface-2"
              role="progressbar"
              aria-valuenow={profile.pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Profile completeness"
            >
              <div
                className="h-full rounded-full bg-trace transition-[width] duration-700"
                style={{ width: `${profile.pct}%` }}
              />
            </div>
            {profile.missing.length > 0 && (
              <p className="mt-2 text-xs text-muted">Still missing: {profile.missing.join(', ')}.</p>
            )}
            <Button href="/profile" size="sm" variant="secondary" className="mt-3">
              {profile.pct === 100 ? 'Edit profile' : 'Finish your profile'}
            </Button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        {[
          { value: open.length, label: 'Open to you', href: '/applications' },
          { value: applications.length, label: 'Applications', href: '/applications' },
          { value: live, label: 'Still running', href: '/applications' },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-blue sm:p-5"
          >
            <p className="tnum display text-3xl sm:text-4xl">{s.value}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted sm:text-sm">
              {s.label}
              <ArrowRight size={14} className="opacity-0 transition-opacity group-hover:opacity-100" />
            </p>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 className="display text-xl">Open to you now</h2>
            <Link href="/drives" className="text-sm text-blue hover:underline">
              All drives
            </Link>
          </div>
          {open.length === 0 ? (
            <EmptyState
              icon={<Sparkles size={20} />}
              title="Nothing open right now"
              body={
                student.cgpa === null || student.branchCode === null
                  ? 'Add your branch and CGPA so the portal can work out which drives you qualify for.'
                  : 'New drives appear here the moment the placement cell publishes one you qualify for.'
              }
              action={
                student.cgpa === null ? <Button href="/profile">Complete your profile</Button> : undefined
              }
            />
          ) : (
            <div className="space-y-3">
              {open.slice(0, 3).map((v) => (
                <DriveCard key={v.drive.id} drive={v.drive} eligibility={v.eligibility} />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="display mb-4 text-xl">What is coming up</h2>
          {upcoming.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line px-5 py-10 text-center text-sm text-muted">
              Nothing scheduled. Rounds appear here once you are in one.
            </p>
          ) : (
            <ol className="space-y-3">
              {upcoming.map((u) => (
                <li key={u.key} className="flex gap-4 rounded-2xl border border-line bg-surface p-4">
                  <span className="mt-1.5 flex flex-col items-center" aria-hidden>
                    <span className="size-2 rounded-full bg-blue" />
                    <span className="mt-1 w-px flex-1 bg-line" />
                  </span>
                  <div className="min-w-0">
                    <Link href={`/drives/${u.driveId}`} className="text-sm font-medium hover:text-blue">
                      {u.company}
                    </Link>
                    <p className="mt-0.5 text-sm text-muted">{u.name}</p>
                    <p className="tnum mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                      <CalendarClock size={13} />
                      {longDate(u.at)}
                    </p>
                    {u.venue && <p className="mt-0.5 text-xs text-faint">{u.venue}</p>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {notices.length > 0 && (
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 className="display text-xl">From the placement cell</h2>
            <Link href="/notices" className="text-sm text-blue hover:underline">
              All notices
            </Link>
          </div>
          <ul className="space-y-3">
            {notices.map((n) => (
              <li
                key={n.id}
                className={`rounded-2xl border bg-surface p-5 ${
                  n.priority === 'URGENT' ? 'border-bad/30' : 'border-line'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {n.priority === 'URGENT' && <Badge tone="bad">Urgent</Badge>}
                  <span className="text-xs text-faint">
                    {shortDate(n.publishedAt.toISOString())}
                  </span>
                </div>
                <p className="mt-2 font-medium">{n.title}</p>
                <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm leading-relaxed text-muted">
                  {n.body}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {applications.length > 0 && (
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 className="display text-xl">Your applications</h2>
            <Link href="/applications" className="text-sm text-blue hover:underline">
              Open the tracker
            </Link>
          </div>
          <ul className="space-y-3">
            {applications.slice(0, 4).map((a) => (
              <li key={a.id} className="rounded-2xl border border-line bg-surface p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="font-medium">
                    {a.drive.company.name}
                    <span className="ml-2 text-sm font-normal text-muted">{a.drive.role}</span>
                  </p>
                  <Badge tone={a.stage === 'OFFER' ? 'ok' : a.stage === 'REJECTED' ? 'bad' : 'info'}>
                    {STAGE_LABEL[a.stage as Stage] ?? a.stage}
                  </Badge>
                </div>
                <div className="mt-4">
                  <Stepper
                    rounds={a.drive.rounds.map((r) => ({ id: r.id, name: r.name }))}
                    results={a.results}
                    stage={a.stage as Stage}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
