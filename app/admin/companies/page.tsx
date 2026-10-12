import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { requireAdmin } from '@/lib/dal';
import { db } from '@/lib/db';
import { CompanyMark, EmptyState } from '@/components/ui/kit';
import { CompanyForm } from './CompanyForm';
import { DeleteCompanyButton } from './DeleteCompanyButton';
import { OFFER_GROUPS, offerGroup, GROUP_LABEL, type OfferGroup } from '@/lib/types';

export const metadata: Metadata = { title: 'Companies' };

const GROUP_COLOR: Record<OfferGroup, string> = {
  '2_MONTH': 'bg-o-2m',
  '6_MONTH': 'bg-o-6m',
  WINTER: 'bg-o-winter',
  FULL_TIME: 'bg-o-full',
};
const GROUP_SHORT: Record<OfferGroup, string> = {
  '2_MONTH': '2M',
  '6_MONTH': '6M',
  WINTER: 'Win',
  FULL_TIME: 'FT',
};

export default async function CompaniesPage() {
  await requireAdmin();

  const companies = await db.company.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { drives: true } },
      drives: {
        where: { type: { not: 'Off-campus' } },
        select: { academicYear: true, type: true },
      },
    },
  });

  const offerCounts = await db.offer.groupBy({
    by: ['driveId'],
    _count: { id: true },
  });
  const driveCompany = await db.drive.findMany({
    select: { id: true, companyId: true },
  });
  const driveToCompany = new Map(driveCompany.map((d) => [d.id, d.companyId]));
  const companyStudentCount = new Map<string, number>();
  for (const oc of offerCounts) {
    const cid = driveToCompany.get(oc.driveId);
    if (cid) companyStudentCount.set(cid, (companyStudentCount.get(cid) ?? 0) + oc._count.id);
  }

  const now = new Date();
  const startYear = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  const recentSeasons = Array.from({ length: 4 }, (_, i) => {
    const y = startYear - i;
    return `${y}-${String(y + 1).slice(2)}`;
  });

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <h1 className="display text-[clamp(1.7rem,3.6vw,2.3rem)]">Companies</h1>
      <p className="mt-2 text-muted">Tap a company to see every visit, which batches they hired, and as what.</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
        <div>
          {companies.length === 0 ? (
            <EmptyState
              icon={<Building2 size={20} />}
              title="No companies yet"
              body="Add the first one with the form beside this."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {companies.map((c, i) => {
                const seasonGroups = new Map<string, Set<OfferGroup>>();
                for (const d of c.drives) {
                  const season = d.academicYear;
                  if (!season) continue;
                  if (!seasonGroups.has(season)) seasonGroups.set(season, new Set());
                  const driveType = d.type;
                  if (driveType === 'Full-time') seasonGroups.get(season)!.add('FULL_TIME');
                  else if (driveType === 'Internship') seasonGroups.get(season)!.add('2_MONTH');
                  else if (driveType === 'Internship + Full-time') seasonGroups.get(season)!.add('6_MONTH');
                  else if (driveType === 'PPO') seasonGroups.get(season)!.add('FULL_TIME');
                }

                return (
                  <div
                    key={c.id}
                    className="arrive group relative flex flex-col rounded-2xl border border-line bg-surface transition-all hover:border-blue/30 hover:bg-blue-wash/10"
                    style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                  >
                    <Link href={`/admin/companies/${c.id}`} className="flex flex-1 flex-col p-5">
                      <div className="flex items-start gap-3">
                        <CompanyMark name={c.name} size="md" />
                        <div className="min-w-0 flex-1">
                          <span className="block text-[15px] font-semibold">{c.name}</span>
                          <span className="block text-xs text-muted">
                            {[c.sector, c.hq].filter(Boolean).join(' · ') || 'No sector'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5 border-t border-line/50 pt-3">
                        {recentSeasons.map((season) => {
                          const groups = seasonGroups.get(season);
                          const hasData = groups && groups.size > 0;
                          return (
                            <div key={season} className="flex items-center gap-2 text-xs">
                              <span className="tnum w-14 shrink-0 font-medium text-muted">{season}</span>
                              {hasData ? (
                                <div className="flex flex-wrap gap-1">
                                  {OFFER_GROUPS.filter((g) => groups.has(g)).map((g) => (
                                    <span
                                      key={g}
                                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${GROUP_COLOR[g]}/20`}
                                      style={{ color: `var(--o-${g === '2_MONTH' ? '2m' : g === '6_MONTH' ? '6m' : g === 'WINTER' ? 'winter' : 'full'})` }}
                                    >
                                      <span className={`size-1.5 rounded-full ${GROUP_COLOR[g]}`} />
                                      {GROUP_SHORT[g]}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[10px] text-faint">—</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </Link>
                    <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <DeleteCompanyButton id={c.id} name={c.name} drives={c._count.drives} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <CompanyForm />
      </div>
    </div>
  );
}
