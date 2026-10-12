import Link from 'next/link';
import type { Metadata } from 'next';
import { CalendarClock, ListChecks, MapPin } from 'lucide-react';
import { requireStudent } from '@/lib/dal';
import { db } from '@/lib/db';
import { openToApply, visibleDrives } from '@/lib/queries';
import { longDate, lpa, shortDate } from '@/lib/utils';
import { STAGE_LABEL, type Stage } from '@/lib/types';
import { Badge, Button, CompanyMark, EmptyState } from '@/components/ui/kit';
import { DriveCard } from '@/components/app/DriveCard';
import { Stepper } from '@/components/app/Stepper';

export const metadata: Metadata = { title: 'Applications' };

export default async function ApplicationsPage() {
  const { student } = await requireStudent();

  const [all, applications] = await Promise.all([
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
  ]);

  const open = openToApply(all);
  const live = applications.filter((a) => a.stage !== 'REJECTED').length;

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-12">
      <div>
        <h1 className="display text-[clamp(1.7rem,3.6vw,2.3rem)]">Applications</h1>
        <p className="mt-2 text-muted">
          What you can still apply to, and how the ones you have applied to are going.
        </p>
      </div>

      {/* ------------------------------------------------ still open to you */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="display text-xl">Open to you</h2>
          <span className="tnum text-sm text-muted">
            {open.length} {open.length === 1 ? 'drive' : 'drives'}
          </span>
        </div>

        {open.length === 0 ? (
          <EmptyState
            title="Nothing to apply to right now"
            body={
              student.cgpa === null || student.branchCode === null
                ? 'Add your branch and CGPA so the portal can work out what you qualify for.'
                : 'Drives you qualify for appear here as soon as the placement cell publishes them.'
            }
            action={
              student.cgpa === null ? <Button href="/profile">Complete your profile</Button> : undefined
            }
          />
        ) : (
          <ul className="space-y-3">
            {open.map((v) => (
              <li key={v.drive.id}>
                <DriveCard drive={v.drive} eligibility={v.eligibility} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* --------------------------------------------------------- tracking */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <h2 className="display text-xl">Your applications</h2>
          {applications.length > 0 && (
            <span className="tnum text-sm text-muted">
              {live} of {applications.length} still running
            </span>
          )}
        </div>

        {applications.length === 0 ? (
          <EmptyState
            icon={<ListChecks size={20} />}
            title="You have not applied to anything yet"
            body="Once you apply, each round shows here as the placement cell records results."
          />
        ) : (
          <ul className="space-y-4">
            {applications.map((a) => {
              const next = a.drive.rounds.find(
                (r) => !a.results.some((x) => x.roundId === r.id && x.result !== 'PENDING'),
              );
              return (
                <li key={a.id} className="rounded-2xl border border-line bg-surface p-5 md:p-6">
                  <div className="flex flex-wrap items-start gap-4">
                    <CompanyMark name={a.drive.company.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">
                        <Link href={`/drives/${a.drive.id}`} className="hover:text-blue">
                          {a.drive.company.name}
                        </Link>
                      </h3>
                      <p className="text-sm text-muted">{a.drive.role}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {a.drive.ctc !== null && <Badge tone="neutral">{lpa(a.drive.ctc)}</Badge>}
                      <Badge
                        tone={a.stage === 'OFFER' ? 'ok' : a.stage === 'REJECTED' ? 'bad' : 'info'}
                      >
                        {STAGE_LABEL[a.stage as Stage] ?? a.stage}
                      </Badge>
                      <span className="text-xs text-muted">
                        Applied {shortDate(a.appliedAt.toISOString())}
                      </span>
                    </div>
                  </div>

                  {a.drive.rounds.length > 0 && (
                    <div className="mt-5 border-t pt-5">
                      <Stepper
                        rounds={a.drive.rounds.map((r) => ({ id: r.id, name: r.name }))}
                        results={a.results}
                        stage={a.stage as Stage}
                      />
                    </div>
                  )}

                  {a.stage !== 'REJECTED' && next?.startsAt && (
                    <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl bg-blue-wash px-4 py-3 text-sm">
                      <span className="font-medium">{next.name}</span>
                      <span className="tnum flex items-center gap-1.5 text-muted">
                        <CalendarClock size={14} />
                        {longDate(next.startsAt.toISOString())}
                      </span>
                      {next.venue && (
                        <span className="flex items-center gap-1.5 text-muted">
                          <MapPin size={14} />
                          {next.venue}
                        </span>
                      )}
                    </div>
                  )}

                  {a.stage === 'REJECTED' && (
                    <p className="mt-4 text-sm text-muted">
                      Not taken forward. The next one is a fresh start.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
