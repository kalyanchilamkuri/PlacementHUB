import Link from 'next/link';
import { verifySession } from '@/lib/dal';
import { getPlacementRows, getSeasons } from '@/lib/placements';
import { cn } from '@/lib/utils';
import { PlacementsBrowser, type PStudent } from '@/app/(student)/placements/PlacementsBrowser';
import { yearLabelOfBatch } from '@/lib/types';

export async function PlacementsView({
  year,
  basePath,
}: {
  year?: string;
  basePath: string;
}) {
  const { role } = await verifySession();
  const seasons = await getSeasons();
  const season = year && seasons.includes(year) ? year : seasons[0];

  const rows = await getPlacementRows(season ? { academicYear: season } : {});
  const isAdmin = role === 'ADMIN';
  const map = new Map<string, PStudent>();
  for (const r of rows) {
    const e =
      map.get(r.studentId) ??
      ({
        studentId: r.studentId,
        name: r.name,
        email: isAdmin ? r.email : undefined,
        rollNo: r.rollNo,
        branchCode: r.branchCode,
        batch: r.batch,
        cgpa: r.cgpa,
        skills: r.skills,
        linkedinUrl: r.linkedinUrl,
        yearLabel: yearLabelOfBatch(r.batch),
        offers: [],
      } satisfies PStudent);
    e.offers.push({
      offerId: r.offerId,
      company: r.company,
      role: r.role,
      offerType: r.offerType,
      convertedFrom: r.convertedFrom,
      ctc: r.ctc,
      stipend: r.stipend,
      isOnCampus: r.isOnCampus,
      offeredOn: r.offeredOn,
    });
    map.set(r.studentId, e);
  }
  const students = [...map.values()];

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <div className="arrive flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[clamp(1.7rem,3.6vw,2.4rem)]">Placements, live</h1>
          <p className="mt-2 max-w-[56ch] text-muted">
            Who is interning now, who has converted to a full-time offer, and where. Tap a name for their card.
          </p>
        </div>
        {seasons.length > 0 && (
          <nav aria-label="Academic year" className="flex flex-wrap gap-1.5">
            {seasons.map((s) => (
              <Link
                key={s}
                href={`${basePath}?year=${s}`}
                className={cn(
                  'tnum rounded-full border px-3 py-1.5 text-sm transition-colors',
                  s === season ? 'border-blue bg-blue-wash text-blue' : 'border-line bg-surface text-muted hover:text-ink',
                )}
              >
                {s}
              </Link>
            ))}
          </nav>
        )}
      </div>

      <div className="mt-7">
        <PlacementsBrowser key={season ?? 'none'} students={students} />
      </div>
    </div>
  );
}
