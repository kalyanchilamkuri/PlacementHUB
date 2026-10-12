import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, CalendarClock, Sparkles, Trophy } from 'lucide-react';
import { requireStudent } from '@/lib/dal';
import { db } from '@/lib/db';
import { openToApply, visibleDrives } from '@/lib/queries';
import { syncDeadlineNotifications } from '@/lib/notify';
import { longDate, lpa } from '@/lib/utils';
import { STAGE_LABEL, type Stage } from '@/lib/types';
import { Badge, Button, EmptyState } from '@/components/ui/kit';
import { DriveCard } from '@/components/app/DriveCard';
import { JourneyRoad } from '@/components/app/JourneyRoad';
import { TimelineFeed } from '@/components/app/TimelineFeed';
import { OfferBadge } from '@/components/ui/OfferBadge';
import { CountUp } from '@/components/ui/CountUp';
import { getTimeline } from '@/lib/placements';

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

  const [all, applications, notices, timeline, myOffers, offerPool] = await Promise.all([
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
      take: 1,
    }),
    getTimeline(6),
    db.offer.findMany({
      where: { studentId: student.id },
      orderBy: { ctc: 'desc' },
      include: { drive: { include: { company: { select: { name: true } } } } },
    }),
    db.offer.findMany({
      where: { offerType: { in: ['FULL_TIME', 'PPO'] }, ctc: { gt: 0 } },
      select: { ctc: true, student: { select: { branchCode: true } } },
    }),
  ]);

  const open = openToApply(all);
  const mine = myOffers.find((o) => ['FULL_TIME', 'PPO'].includes(o.offerType) && o.ctc > 0);
  const avg = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
  const collegeAvg = avg(offerPool.map((o) => o.ctc));
  const branchAvg = avg(
    offerPool.filter((o) => o.student.branchCode === student.branchCode).map((o) => o.ctc),
  );
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

  const urgent = notices.find((n) => n.priority === 'URGENT');
  const firstName = (name ?? 'there').split(' ')[0];
  const placedAt = myOffers[0];

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-8">
      <section className="arrive rim relative overflow-hidden rounded-3xl bg-surface p-6 md:p-8">
        <div className="aurora-blob pointer-events-none absolute -right-10 -top-16 size-64 rounded-full bg-blue/20" aria-hidden />
        <div className="aurora-blob pointer-events-none absolute -bottom-20 left-1/3 size-56 rounded-full bg-arch/15" aria-hidden style={{ animationDelay: '-6s' }} />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-sm text-muted">Welcome back</p>
            <h1 className="display text-[clamp(1.8rem,4vw,2.6rem)]">{firstName}</h1>
            <p className="tnum mt-1 text-sm text-muted">
              {[student.rollNo, student.branch?.code, student.batch && `batch ${student.batch}`]
                .filter(Boolean)
                .join(', ') || 'Fill in your profile to start applying'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {student.verified && <Badge tone="ok">Academics verified</Badge>}
              {placedAt ? (
                <>
                  {myOffers.map((o) => (
                    <OfferBadge key={o.id} type={o.offerType} />
                  ))}
                </>
              ) : (
                <Badge>No offer yet, keep going</Badge>
              )}
            </div>
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
              <div className="grow-x h-full rounded-full bg-trace" style={{ width: `${profile.pct}%` }} />
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

      {urgent && (
        <Link
          href="/notices"
          className="arrive lift flex items-center gap-3 rounded-2xl border border-bad/30 bg-[color-mix(in_oklab,var(--bad)_7%,transparent)] px-5 py-3"
        >
          <Badge tone="bad">Urgent</Badge>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">{urgent.title}</span>
          <ArrowRight size={16} className="text-bad" />
        </Link>
      )}

      <section className="grid grid-cols-3 gap-3">
        {[
          { value: open.length, label: 'Open to you', href: '/drives' },
          { value: applications.length, label: 'Applications', href: '/applications' },
          { value: live, label: 'Still running', href: '/applications' },
        ].map((t, i) => (
          <Link
            key={t.label}
            href={t.href}
            className="arrive lift group rounded-2xl border border-line bg-surface p-4 sm:p-5"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <p className="tnum display text-3xl sm:text-4xl">
              <CountUp to={t.value} />
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted sm:text-sm">
              {t.label}
              <ArrowRight size={14} className="opacity-0 transition-opacity group-hover:opacity-100" />
            </p>
          </Link>
        ))}
      </section>

      {applications.length > 0 && (
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 className="display text-xl">Where you are</h2>
            <Link href="/applications" className="text-sm text-blue hover:underline">
              All applications
            </Link>
          </div>
          <ul className="space-y-3">
            {applications.slice(0, 3).map((a) => (
              <li key={a.id} className="lift rounded-2xl border border-line bg-surface p-5">
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
                  <JourneyRoad
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

      {mine && collegeAvg > 0 && (
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="display text-xl">How your package compares</h2>
          <div className="mt-4 space-y-3">
            {[
              { label: 'You', value: mine.ctc, color: 'var(--arch)' },
              ...(branchAvg > 0 ? [{ label: `${student.branchCode} average`, value: branchAvg, color: 'var(--blue)' }] : []),
              { label: 'College average', value: collegeAvg, color: 'var(--trace)' },
            ].map((b) => {
              const max = Math.max(mine.ctc, branchAvg, collegeAvg);
              return (
                <div key={b.label}>
                  <div className="flex justify-between text-sm">
                    <span>{b.label}</span>
                    <span className="tnum font-medium">{lpa(b.value)}</span>
                  </div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-surface-2">
                    <div className="grow-x h-full rounded-full" style={{ width: `${(b.value / max) * 100}%`, background: b.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
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
              title="No drives open right now"
              body={
                student.cgpa === null || student.branchCode === null
                  ? 'Add your branch and CGPA so the portal can work out which drives you qualify for.'
                  : 'Nothing at the moment. Relax, and practise a few DSA problems. New drives show up here the moment they are published.'
              }
              action={student.cgpa === null ? <Button href="/profile">Complete your profile</Button> : undefined}
            />
          ) : (
            <div className="space-y-3">
              {open.slice(0, 3).map((v) => (
                <DriveCard key={v.drive.id} drive={v.drive} eligibility={v.eligibility} />
              ))}
            </div>
          )}

          {upcoming.length > 0 && (
            <div className="mt-8">
              <h2 className="display mb-4 text-xl">What is coming up</h2>
              <ol className="space-y-3">
                {upcoming.map((u) => (
                  <li key={u.key} className="lift flex gap-4 rounded-2xl border border-line bg-surface p-4">
                    <span className="mt-1.5 flex flex-col items-center" aria-hidden>
                      <span className="size-2 rounded-full bg-blue" />
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
            </div>
          )}
        </div>

        <div>
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 className="display flex items-center gap-2 text-xl">
              <Trophy size={18} className="text-arch" /> Just placed
            </h2>
            <Link href="/placements" className="text-sm text-blue hover:underline">
              See everyone
            </Link>
          </div>
          <TimelineFeed items={timeline} />
        </div>
      </section>
    </div>
  );
}
