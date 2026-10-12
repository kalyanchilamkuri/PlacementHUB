import type { Metadata } from 'next';
import { Building2 } from 'lucide-react';
import { requireAdmin } from '@/lib/dal';
import { db } from '@/lib/db';
import { CompanyMark, EmptyState } from '@/components/ui/kit';
import { CompanyForm } from './CompanyForm';
import { DeleteCompanyButton } from './DeleteCompanyButton';

export const metadata: Metadata = { title: 'Companies' };

export default async function CompaniesPage() {
  await requireAdmin();

  const companies = await db.company.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { drives: true } } },
  });

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <h1 className="display text-[clamp(1.7rem,3.6vw,2.3rem)]">Companies</h1>
      <p className="mt-2 text-muted">Every drive belongs to a company, so add them here first.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
        <div>
          {companies.length === 0 ? (
            <EmptyState
              icon={<Building2 size={20} />}
              title="No companies yet"
              body="Add the first one with the form beside this. You can edit the details later."
            />
          ) : (
            <ul className="space-y-2">
              {companies.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-4"
                >
                  <CompanyMark name={c.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted">
                      {[c.sector, c.hq].filter(Boolean).join(', ') || 'No sector recorded'}
                    </p>
                  </div>
                  <span className="tnum text-sm text-muted">
                    {c._count.drives} {c._count.drives === 1 ? 'drive' : 'drives'}
                  </span>
                  <DeleteCompanyButton id={c.id} name={c.name} drives={c._count.drives} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <CompanyForm />
      </div>
    </div>
  );
}
