import Link from 'next/link';
import type { Metadata } from 'next';
import { Briefcase, Plus } from 'lucide-react';
import { requireAdmin } from '@/lib/dal';
import { db } from '@/lib/db';
import { lpa, longDate } from '@/lib/utils';
import { Badge, Button, CompanyMark, EmptyState, type Tone } from '@/components/ui/kit';

export const metadata: Metadata = { title: 'Drives' };

const STATUS_TONE: Record<string, Tone> = {
  DRAFT: 'neutral',
  PUBLISHED: 'ok',
  CLOSED: 'warn',
  COMPLETED: 'info',
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  CLOSED: 'Closed',
  COMPLETED: 'Completed',
};

export default async function AdminDrivesPage() {
  await requireAdmin();

  const [drives, companies] = await Promise.all([
    db.drive.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        company: true,
        _count: { select: { applications: true, rounds: true } },
      },
    }),
    db.company.count(),
  ]);

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[clamp(1.7rem,3.6vw,2.3rem)]">Drives</h1>
          <p className="mt-2 text-muted">Published drives appear for every eligible student.</p>
        </div>
        {companies > 0 && (
          <Button href="/admin/drives/new">
            <Plus size={16} />
            New drive
          </Button>
        )}
      </div>

      <div className="mt-8">
        {drives.length === 0 ? (
          <EmptyState
            icon={<Briefcase size={20} />}
            title="No drives yet"
            body={
              companies === 0
                ? 'Add a company first — every drive belongs to one.'
                : 'Create a drive, set who is eligible, and publish it when the dates are confirmed.'
            }
            action={
              companies === 0 ? (
                <Button href="/admin/companies">Add a company</Button>
              ) : (
                <Button href="/admin/drives/new">Create a drive</Button>
              )
            }
          />
        ) : (
          <ul className="space-y-2">
            {drives.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/admin/drives/${d.id}/applicants`}
                  className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-blue"
                >
                  <CompanyMark name={d.company.name} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{d.company.name}</span>
                      <Badge tone={STATUS_TONE[d.status] ?? 'neutral'}>
                        {STATUS_LABEL[d.status] ?? d.status}
                      </Badge>
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">{d.role}</span>
                  </span>
                  <span className="text-sm text-muted">
                    {d.ctc !== null && <span className="tnum mr-4">{lpa(d.ctc)}</span>}
                    <span className="tnum">Closes {longDate(d.deadline.toISOString())}</span>
                  </span>
                  <span className="tnum w-24 text-right text-sm">
                    {d._count.applications}{' '}
                    <span className="text-muted">
                      {d._count.applications === 1 ? 'applicant' : 'applicants'}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
