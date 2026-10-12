import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/dal';
import { db } from '@/lib/db';
import { DriveForm } from './DriveForm';

export const metadata: Metadata = { title: 'New drive' };

export default async function NewDrivePage() {
  await requireAdmin();

  const [companies, branches] = await Promise.all([
    db.company.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    db.branch.findMany({
      orderBy: [{ programme: 'asc' }, { code: 'asc' }],
      select: {
        code: true,
        name: true,
        programme: true,
        _count: { select: { students: true } },
      },
    }),
  ]);

  if (companies.length === 0) redirect('/admin/companies');

  return (
    <div className="mx-auto w-full max-w-[860px]">
      <h1 className="display text-[clamp(1.7rem,3.6vw,2.3rem)]">New drive</h1>
      <p className="mt-2 text-muted">
        Save it as a draft while dates are unconfirmed. Publishing makes it visible to every
        eligible student.
      </p>
      <DriveForm
        companies={companies}
        branches={branches.map((b) => ({
          code: b.code,
          name: b.name,
          programme: b.programme,
          students: b._count.students,
        }))}
      />
    </div>
  );
}
