import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Check, ChevronRight, MapPin, X } from 'lucide-react';
import { requireStudent } from '@/lib/dal';
import { db } from '@/lib/db';
import { checkEligibility } from '@/lib/eligibility';
import { fromCsv, ROUND_TYPE_LABEL, type RoundType } from '@/lib/types';
import { longDate, lpa } from '@/lib/utils';
import { Badge, CompanyMark } from '@/components/ui/kit';
import { ApplyPanel } from './ApplyPanel';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const drive = await db.drive.findUnique({
    where: { id },
    select: { role: true, company: { select: { name: true } } },
  });
  return { title: drive ? `${drive.company.name} — ${drive.role}` : 'Drive not found' };
}

function Rule({ met, label }: { met: boolean; label: string }) {
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span
        className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${
          met ? 'bg-trace-wash text-ok' : 'bg-[color-mix(in_oklab,var(--bad)_14%,transparent)] text-bad'
        }`}
        aria-hidden
      >
        {met ? <Check size={13} /> : <X size={13} />}
      </span>
      <span className="text-sm">
        {label}
        <span className={`ml-2 text-xs ${met ? 'text-ok' : 'text-bad'}`}>
          {met ? 'Met' : 'Not met'}
        </span>
      </span>
    </li>
  );
}

export default async function DriveDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { student } = await requireStudent();
  const { id } = await params;

  const drive = await db.drive.findUnique({
    where: { id },
    include: {
      company: true,
      rounds: { orderBy: { order: 'asc' } },
      applications: { where: { studentId: student.id }, select: { id: true } },
    },
  });

  // Drafts belong to the cell, not to students.
  if (!drive || drive.status === 'DRAFT') notFound();

  const check = checkEligibility(drive, student);
  const applied = drive.applications.length > 0;
  const branches = fromCsv(drive.branchCodes);

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/drives" className="hover:text-blue">
          Drives
        </Link>
        <ChevronRight size={14} />
        <span className="text-ink">{drive.company.name}</span>
      </nav>

      <header className="mt-5 flex flex-wrap items-start gap-5">
        <CompanyMark name={drive.company.name} size="lg" className="size-20" />
        <div className="min-w-0 flex-1">
          <h1 className="display text-[clamp(1.6rem,3.6vw,2.3rem)]">{drive.company.name}</h1>
          <p className="mt-1 text-lg text-muted">{drive.role}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{drive.type}</Badge>
            {drive.company.sector && <Badge tone="info">{drive.company.sector}</Badge>}
            {applied ? (
              <Badge tone="info">You have applied</Badge>
            ) : check.eligible ? (
              <Badge tone="ok">You are eligible</Badge>
            ) : (
              <Badge tone="bad">Not eligible — {check.reason}</Badge>
            )}
          </div>

          <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            {drive.ctc !== null && (
              <div>
                <dt className="text-muted">Package</dt>
                <dd className="tnum mt-0.5 text-lg font-medium">{lpa(drive.ctc)}</dd>
              </div>
            )}
            {drive.stipend !== null && (
              <div>
                <dt className="text-muted">Stipend</dt>
                <dd className="tnum mt-0.5 text-lg font-medium">
                  ₹{drive.stipend.toLocaleString('en-IN')}/month
                </dd>
              </div>
            )}
            {drive.locations && (
              <div>
                <dt className="text-muted">Location</dt>
                <dd className="mt-0.5 flex items-center gap-1.5 text-lg font-medium">
                  <MapPin size={16} className="text-trace" />
                  {drive.locations}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </header>

      <div className="mt-9 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="space-y-8">
          {drive.jdText && (
            <section>
              <h2 className="text-base font-semibold">About the role</h2>
              <p className="mt-2 max-w-[62ch] whitespace-pre-line leading-relaxed text-muted">
                {drive.jdText}
              </p>
            </section>
          )}

          <section>
            <h2 className="text-base font-semibold">Checked against your record</h2>
            <p className="mt-1 text-sm text-muted">
              These are the rules the cell set for this drive.
            </p>
            <ul className="mt-4 divide-y rounded-xl border border-line bg-surface px-4">
              {branches.length > 0 && (
                <Rule
                  met={Boolean(student.branchCode && branches.includes(student.branchCode))}
                  label={`Open to ${branches.join(', ')} — you are ${student.branchCode ?? 'not set'}`}
                />
              )}
              <Rule
                met={(student.cgpa ?? -1) >= drive.minCgpa}
                label={`CGPA at least ${drive.minCgpa.toFixed(1)} — yours is ${
                  student.cgpa?.toFixed(2) ?? 'not set'
                }`}
              />
              <Rule
                met={student.activeBacklogs <= drive.maxBacklogs}
                label={`At most ${drive.maxBacklogs} active backlog${
                  drive.maxBacklogs === 1 ? '' : 's'
                } — you have ${student.activeBacklogs}`}
              />
              {drive.minTenthPct !== null && (
                <Rule
                  met={(student.tenthPct ?? -1) >= drive.minTenthPct}
                  label={`Class 10 at least ${drive.minTenthPct}% — yours is ${
                    student.tenthPct ?? 'not set'
                  }`}
                />
              )}
              {drive.minTwelfthPct !== null && (
                <Rule
                  met={(student.twelfthPct ?? -1) >= drive.minTwelfthPct}
                  label={`Class 12 at least ${drive.minTwelfthPct}% — yours is ${
                    student.twelfthPct ?? 'not set'
                  }`}
                />
              )}
            </ul>
          </section>

          {drive.rounds.length > 0 && (
            <section>
              <h2 className="text-base font-semibold">Rounds</h2>
              <ol className="mt-4">
                {drive.rounds.map((r, i) => (
                  <li key={r.id} className="flex gap-4">
                    <span className="flex flex-col items-center" aria-hidden>
                      <span className="tnum grid size-8 shrink-0 place-items-center rounded-full border border-line bg-surface text-xs font-semibold">
                        {i + 1}
                      </span>
                      {i < drive.rounds.length - 1 && <span className="my-1 w-px flex-1 bg-line" />}
                    </span>
                    <div className="pb-6">
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted">
                        {ROUND_TYPE_LABEL[r.type as RoundType] ?? r.type}
                      </p>
                      {r.startsAt && (
                        <p className="tnum mt-1 text-sm text-muted">
                          {longDate(r.startsAt.toISOString())}
                        </p>
                      )}
                      {r.venue && <p className="mt-0.5 text-sm text-faint">{r.venue}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <ApplyPanel
          driveId={drive.id}
          deadline={drive.deadline.toISOString()}
          closed={drive.status !== 'PUBLISHED'}
          eligible={check.eligible}
          reason={check.eligible ? null : check.reason}
          applied={applied}
          hasResume={Boolean(student.resumeUrl)}
        />
      </div>
    </div>
  );
}
