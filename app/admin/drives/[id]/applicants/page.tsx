import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ChevronRight, Users } from 'lucide-react';
import { requireAdmin } from '@/lib/dal';
import { db } from '@/lib/db';
import { lpa, longDate } from '@/lib/utils';
import { fromCsv } from '@/lib/types';
import { Badge, CompanyMark, EmptyState } from '@/components/ui/kit';
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

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/admin/drives" className="hover:text-blue">
          Drives
        </Link>
        <ChevronRight size={14} />
        <span className="text-ink">{drive.company.name}</span>
      </nav>

      <header className="mt-5 flex flex-wrap items-start gap-5">
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
      </header>

      <div className="mt-8 flex flex-wrap gap-3">
        {[
          { label: 'Applied', value: counts.total, tone: 'neutral' as const },
          { label: 'In progress', value: counts.inProgress, tone: 'info' as const },
          { label: 'Offers', value: counts.offer, tone: 'ok' as const },
          { label: 'Not selected', value: counts.rejected, tone: 'bad' as const },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-line bg-surface px-4 py-2.5">
            <span className="tnum block text-xl font-semibold">{c.value}</span>
            <span className="text-xs text-muted">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="mt-6">
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
