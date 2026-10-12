import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/dal';
import { db } from '@/lib/db';
import { offerMoney, shortDate } from '@/lib/utils';
import { OfferBadge } from '@/components/ui/OfferBadge';
import { CompanyMark } from '@/components/ui/kit';
import { RecordOfferForm } from './RecordOfferForm';
import { RecentOfferActions } from './RecentOfferActions';
import { BulkImport } from './BulkImport';

export const metadata: Metadata = { title: 'Record offer' };

export default async function RecordOfferPage() {
  await requireAdmin();

  const [drives, companies, recent] = await Promise.all([
    db.drive.findMany({
      where: { type: { not: 'Off-campus' } },
      orderBy: { createdAt: 'desc' },
      include: { company: { select: { name: true } } },
    }),
    db.company.findMany({ select: { name: true }, orderBy: { name: 'asc' } }),
    db.offer.findMany({
      orderBy: { offeredOn: 'desc' },
      take: 8,
      include: {
        student: { include: { user: { select: { name: true } } } },
        drive: { include: { company: { select: { name: true } } } },
      },
    }),
  ]);

  return (
    <div className="mx-auto grid w-full max-w-[1100px] gap-8 xl:grid-cols-[1.25fr_1fr]">
      <div className="xl:col-span-2">
        <h1 className="display text-[clamp(1.7rem,3.6vw,2.3rem)]">Record an offer</h1>
        <p className="mt-2 max-w-[60ch] text-muted">
          This is the only place offers are entered. Saving updates the student&apos;s tracker, the
          placements page, the timeline, the analytics and the AI assistant in one go.
        </p>
      </div>

      <div className="arrive">
        <RecordOfferForm
          drives={drives.map((d) => ({
            id: d.id,
            type: d.type,
            label: `${d.company.name} - ${d.role}${d.academicYear ? ` (${d.academicYear})` : ''}`,
          }))}
          companies={companies.map((c) => c.name)}
        />
      </div>

      <div className="arrive xl:col-span-2" style={{ animationDelay: '120ms' }}>
        <BulkImport />
      </div>

      <aside className="arrive xl:col-start-2 xl:row-start-2 xl:row-span-2" style={{ animationDelay: '80ms' }}>
        <h2 className="display text-xl">Just recorded</h2>
        {recent.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-line px-5 py-10 text-center text-sm text-muted">
            Offers you record will show up here.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {recent.map((o) => (
              <li key={o.id} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3">
                <CompanyMark name={o.drive.company.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{o.student.user.name ?? o.student.rollNo}</p>
                  <p className="truncate text-xs text-muted">
                    {o.drive.company.name} · {offerMoney(o) ?? 'package not set'} · {shortDate(o.offeredOn.toISOString())}
                    {!o.isOnCampus && ' · off-campus'}
                  </p>
                  <div className="mt-1.5">
                    <OfferBadge type={o.offerType} />
                  </div>
                </div>
                <RecentOfferActions
                  id={o.id}
                  canPpo={['2_MONTH_INTERN', '6_MONTH_INTERN', 'WINTER_INTERN'].includes(o.offerType)}
                />
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
