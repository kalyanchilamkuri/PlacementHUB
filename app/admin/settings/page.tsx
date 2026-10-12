import type { Metadata } from 'next';
import { GitBranch } from 'lucide-react';
import { requireAdmin } from '@/lib/dal';
import { db } from '@/lib/db';
import { ALLOWED_EMAIL_DOMAIN } from '@/lib/site';
import { Badge, EmptyState } from '@/components/ui/kit';
import { BranchForm } from './BranchForm';
import { DeleteBranchButton } from './DeleteBranchButton';
import { ResetPassword } from './ResetPassword';
import { RoleToggle } from './RoleToggle';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const me = await requireAdmin();

  const [branches, users] = await Promise.all([
    db.branch.findMany({
      orderBy: [{ programme: 'asc' }, { code: 'asc' }],
      include: { _count: { select: { students: true } } },
    }),
    db.user.findMany({
      orderBy: [{ role: 'asc' }, { email: 'asc' }],
      select: { id: true, name: true, email: true, role: true },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-10">
      <div>
        <h1 className="display text-[clamp(1.7rem,3.6vw,2.3rem)]">Settings</h1>
        <p className="mt-2 text-muted">
          Branches, and who on the cell can manage the portal.
        </p>
      </div>

      <section>
        <h2 className="display text-xl">Branches</h2>
        <p className="mt-1 text-sm text-muted">
          Drives are restricted by branch and students pick theirs on their profile.
        </p>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
          <div>
            {branches.length === 0 ? (
              <EmptyState
                icon={<GitBranch size={20} />}
                title="No branches yet"
                body="Add each programme's branches. Students cannot complete their profile until at least one exists."
              />
            ) : (
              <ul className="divide-y rounded-2xl border border-line bg-surface">
                {branches.map((b) => (
                  <li key={b.code} className="flex items-center gap-4 p-4">
                    <span className="display-caps w-16 shrink-0 text-sm text-blue">{b.code}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{b.name}</span>
                      <span className="block text-xs text-muted">{b.programme}</span>
                    </span>
                    <span className="tnum text-xs text-muted">
                      {b._count.students} {b._count.students === 1 ? 'student' : 'students'}
                    </span>
                    <DeleteBranchButton code={b.code} inUse={b._count.students > 0} />
                  </li>
                ))}
              </ul>
            )}
          </div>
          <BranchForm />
        </div>
      </section>

      <section>
        <h2 className="display text-xl">Who can manage the portal</h2>
        <p className="mt-1 text-sm text-muted">
          Anyone with an @{ALLOWED_EMAIL_DOMAIN} address can sign in as a student. Only the people
          marked admin here can add companies, publish drives or move applicants.
        </p>

        <ul className="mt-5 divide-y rounded-2xl border border-line bg-surface">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-4 p-4">
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{u.name ?? u.email}</span>
                <span className="block truncate text-xs text-muted">{u.email}</span>
              </span>
              {u.role === 'ADMIN' ? <Badge tone="ok">Admin</Badge> : <Badge tone="neutral">Student</Badge>}
              <ResetPassword userId={u.id} email={u.email} />
              {u.id === me.userId ? (
                <span className="text-xs text-faint">That is you</span>
              ) : (
                <RoleToggle userId={u.id} role={u.role === 'ADMIN' ? 'ADMIN' : 'STUDENT'} />
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
