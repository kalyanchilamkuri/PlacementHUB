import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, Award, Building2, Check, GitBranch, Briefcase } from 'lucide-react';
import { requireAdmin } from '@/lib/dal';
import { db } from '@/lib/db';
import { lpa } from '@/lib/utils';
import { Badge, Button, StatTile } from '@/components/ui/kit';

export const metadata: Metadata = { title: 'Overview' };

export default async function AdminOverviewPage() {
  await requireAdmin();

  const [branches, companies, drives, students, applications, offers, openDrives] =
    await Promise.all([
      db.branch.count(),
      db.company.count(),
      db.drive.count(),
      db.student.count(),
      db.application.count(),
      db.offer.findMany({ select: { ctc: true, studentId: true, offerType: true } }),
      db.drive.findMany({
        where: { status: 'PUBLISHED' },
        include: { company: true, _count: { select: { applications: true } } },
        orderBy: { deadline: 'asc' },
        take: 5,
      }),
    ]);

  const setupSteps = [
    {
      done: branches > 0,
      title: 'Add your branches',
      body: 'Drives are restricted by branch, and students pick theirs on their profile.',
      href: '/admin/settings',
      cta: 'Add a branch',
      icon: GitBranch,
    },
    {
      done: companies > 0,
      title: 'Add a company',
      body: 'Every drive belongs to a company.',
      href: '/admin/companies',
      cta: 'Add a company',
      icon: Building2,
    },
    {
      done: drives > 0,
      title: 'Publish a drive',
      body: 'Once published, eligible students see it on their dashboard and calendar.',
      href: '/admin/drives/new',
      cta: 'Create a drive',
      icon: Briefcase,
    },
  ];

  const remaining = setupSteps.filter((s) => !s.done);
  const placedStudents = new Set(offers.map((o) => o.studentId)).size;
  const placed = offers.length;
  const packaged = offers.filter((o) => o.ctc > 0 && ['FULL_TIME', 'PPO'].includes(o.offerType));
  const avg = packaged.length
    ? Math.round(packaged.reduce((a, o) => a + o.ctc, 0) / packaged.length)
    : 0;
  const highest = packaged.reduce((a, o) => Math.max(a, o.ctc), 0);

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-9">
      <div>
        <h1 className="display text-[clamp(1.7rem,3.6vw,2.3rem)]">Overview</h1>
        <p className="mt-2 text-muted">Everything in the portal is what your cell has entered.</p>
      </div>

      {remaining.length > 0 && (
        <section className="glass rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="display text-xl">Get set up</h2>
            <Badge tone="info">
              {setupSteps.length - remaining.length} of {setupSteps.length} done
            </Badge>
          </div>
          <ol className="mt-5 space-y-3">
            {setupSteps.map((s) => (
              <li
                key={s.title}
                className="flex flex-wrap items-center gap-4 rounded-xl border border-line bg-surface p-4"
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-full ${
                    s.done ? 'bg-trace-wash text-ok' : 'bg-surface-2 text-muted'
                  }`}
                  aria-hidden
                >
                  {s.done ? <Check size={17} /> : <s.icon size={17} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block font-medium ${s.done ? 'text-muted line-through' : ''}`}>
                    {s.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">{s.body}</span>
                </span>
                {!s.done && (
                  <Button href={s.href} size="sm">
                    {s.cta}
                  </Button>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="arrive rim relative overflow-hidden rounded-3xl bg-surface p-6 md:p-7">
        <div className="aurora-blob pointer-events-none absolute -right-10 -top-16 size-60 rounded-full bg-trace/20" aria-hidden />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="tnum display text-[clamp(2rem,5vw,3rem)]">
              {placedStudents}
              <span className="text-muted"> of {students} placed</span>
              <span className="text-gradient ml-3">
                {students ? Math.round((placedStudents / students) * 100) : 0}%
              </span>
            </p>
            <p className="mt-1 text-sm text-muted">
              {placed} offer{placed === 1 ? '' : 's'} recorded across {companies} compan
              {companies === 1 ? 'y' : 'ies'}.
            </p>
          </div>
          <Button href="/admin/offers" size="lg" className="sun-btn hover:brightness-110">
            <Award size={18} /> Record an offer
          </Button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile value={students} label="Students registered" note="Created on first sign-in" />
        <StatTile value={applications} label="Applications" />
        <StatTile
          tone="accent"
          value={highest ? lpa(highest) : '—'}
          label="Highest package"
          note={placed ? `${placed} offer${placed === 1 ? '' : 's'} recorded` : 'No offers yet'}
        />
        <StatTile value={avg ? lpa(avg) : '—'} label="Average package" note="Full-time and PPO offers" />
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="display text-xl">Open drives</h2>
          <Link href="/admin/drives" className="text-sm text-blue hover:underline">
            All drives
          </Link>
        </div>
        {openDrives.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-sm text-muted">
            Nothing is open. Create a drive and publish it when you are ready.
          </p>
        ) : (
          <ul className="space-y-2">
            {openDrives.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/admin/drives/${d.id}/applicants`}
                  className="group flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-4 transition-colors hover:border-blue"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{d.company.name}</span>
                    <span className="block text-sm text-muted">{d.role}</span>
                  </span>
                  <span className="tnum text-sm text-muted">
                    {d._count.applications}{' '}
                    {d._count.applications === 1 ? 'applicant' : 'applicants'}
                  </span>
                  <ArrowRight size={16} className="text-faint group-hover:text-blue" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
