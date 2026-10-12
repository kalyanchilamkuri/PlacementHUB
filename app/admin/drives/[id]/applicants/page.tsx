import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, CheckCircle, Clock, Users, XCircle } from 'lucide-react';
import { requireAdmin } from '@/lib/dal';
import { db } from '@/lib/db';
import { lpa, longDate } from '@/lib/utils';
import { fromCsv } from '@/lib/types';
import { Badge, CompanyMark, EmptyState } from '@/components/ui/kit';
import { CountUp } from '@/components/ui/CountUp';
import { DriveStatusControl } from './DriveStatusControl';
import { ToggleTable } from './ToggleTable';

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
  return { title: drive ? `${drive.company.name} applicants` : 'Drive not found' };
}

export default async function ApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const drive = await db.drive.findUnique({
    where: { id },
    include: {
      company: true,
      rounds: { orderBy: { order: 'asc' } },
      applications: {
        orderBy: { appliedAt: 'asc' },
        include: {
          results: true,
          student: {
            include: {
              user: { select: { name: true, email: true } },
              branch: { select: { code: true } },
            },
          },
        },
      },
    },
  });

  if (!drive) notFound();

  const counts = {
    total: drive.applications.length,
    inProgress: drive.applications.filter((a) => a.stage === 'IN_PROGRESS').length,
    offer: drive.applications.filter((a) => a.stage === 'OFFER').length,
    rejected: drive.applications.filter((a) => a.stage === 'REJECTED').length,
  };

  const branches = fromCsv(drive.branchCodes);

  const tiles = [
    { icon: Users, label: 'Applied', value: counts.total, color: 'var(--o-6m)' },
    { icon: Clock, label: 'In progress', value: counts.inProgress, color: 'var(--o-2m)' },
    { icon: CheckCircle, label: 'Offers', value: counts.offer, color: 'var(--o-full)' },
    { icon: XCircle, label: 'Not selected', value: counts.rejected, color: 'var(--o-winter)' },
  ];

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-7">
      <Link href="/admin/drives" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-blue">
        <ArrowLeft size={15} /> Drives
      </Link>

      <section className="arrive relative overflow-hidden rounded-3xl border border-line bg-surface">
        {/* Gradient blobs */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <span className="absolute -right-20 -top-20 size-80 rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, var(--o-6m), transparent 70%)' }} />
          <span className="absolute -bottom-16 -left-16 size-60 rounded-full opacity-[0.06]" style={{ background: 'radial-gradient(circle, var(--o-full), transparent 70%)' }} />
          <span className="absolute right-1/3 top-1/2 size-40 rounded-full opacity-[0.05]" style={{ background: 'radial-gradient(circle, var(--o-2m), transparent 70%)' }} />
        </div>

        {/* Company info */}
        <div className="relative flex flex-wrap items-center gap-5 p-6 pb-0 md:p-8 md:pb-0">
          <CompanyMark name={drive.company.name} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="display text-[clamp(1.6rem,3.4vw,2.2rem)]">{drive.company.name}</h1>
            <p className="mt-1 text-muted">{drive.role}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{drive.type}</Badge>
              {drive.ctc !== null && <Badge tone="accent">{lpa(drive.ctc)}</Badge>}
              <Badge tone="info">
                {branches.length ? branches.join(', ') : 'All branches'}
              </Badge>
              {drive.minCgpa > 0 && (
                <Badge tone="neutral">{drive.minCgpa.toFixed(1)} CGPA and above</Badge>
              )}
            </div>
            <p className="tnum mt-3 text-sm text-muted">
              Closes {longDate(drive.deadline.toISOString())}
            </p>
          </div>
          <DriveStatusControl id={drive.id} status={drive.status} />
        </div>

        {/* Stat tiles */}
        <dl className="relative mt-6 grid grid-cols-2 gap-px border-t border-line/50 bg-line/30 md:grid-cols-4">
          {tiles.map((t) => (
            <div
              key={t.label}
              className="relative overflow-hidden bg-surface px-5 py-5"
            >
              <span
                className="pointer-events-none absolute inset-0 opacity-[0.04]"
                style={{ background: `linear-gradient(135deg, ${t.color}, transparent 60%)` }}
              />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <span
                    className="grid size-8 place-items-center rounded-lg"
                    style={{
                      color: t.color,
                      backgroundColor: `color-mix(in oklab, ${t.color} 12%, transparent)`,
                    }}
                  >
                    <t.icon size={16} />
                  </span>
                  <dt className="text-xs text-muted">{t.label}</dt>
                </div>
                <dd
                  className="tnum display mt-2 text-3xl"
                  style={{ color: t.color }}
                >
                  <CountUp to={t.value} />
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      <div>
        {drive.rounds.length === 0 ? (
          <EmptyState
            title="This drive has no rounds"
            body="Rounds are the columns you toggle students through. Add them to the drive first."
          />
        ) : drive.applications.length === 0 ? (
          <EmptyState
            icon={<Users size={20} />}
            title="Nobody has applied yet"
            body={
              drive.status === 'PUBLISHED'
                ? 'Eligible students can see this drive. Applicants will appear here as they apply.'
                : 'This drive is not published, so students cannot see it yet.'
            }
          />
        ) : (
          <ToggleTable
            rounds={drive.rounds.map((r) => ({ id: r.id, name: r.name, type: r.type }))}
            rows={drive.applications.map((a) => ({
              applicationId: a.id,
              name: a.student.user.name ?? a.student.user.email,
              email: a.student.user.email,
              rollNo: a.student.rollNo,
              branch: a.student.branch?.code ?? null,
              cgpa: a.student.cgpa,
              resumeUrl: a.student.resumeUrl,
              stage: a.stage,
              results: Object.fromEntries(a.results.map((r) => [r.roundId, r.result])),
            }))}
          />
        )}
      </div>
    </div>
  );
}
