import Link from 'next/link';
import type { Metadata } from 'next';
import { CalendarDays } from 'lucide-react';
import { requireStudent } from '@/lib/dal';
import { db } from '@/lib/db';
import { checkEligibility } from '@/lib/eligibility';
import { longDate } from '@/lib/utils';
import { EmptyState } from '@/components/ui/kit';

export const metadata: Metadata = { title: 'Calendar' };

type Kind = 'Deadline' | 'Test' | 'Interview';

const KIND_COLOR: Record<Kind, string> = {
  Deadline: 'var(--arch)',
  Test: 'var(--blue)',
  Interview: 'var(--trace)',
};

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default async function CalendarPage() {
  const { student } = await requireStudent();

  const drives = await db.drive.findMany({
    where: { status: { in: ['PUBLISHED', 'CLOSED'] } },
    include: { company: { select: { name: true } }, rounds: { orderBy: { order: 'asc' } } },
  });

  // Only what this student could actually attend.
  const mine = drives.filter((d) => checkEligibility(d, student).eligible);

  const events = mine.flatMap((d) => {
    const list: { at: Date; kind: Kind; label: string; driveId: string }[] = [
      {
        at: d.deadline,
        kind: 'Deadline',
        label: `${d.company.name} closes`,
        driveId: d.id,
      },
    ];
    for (const r of d.rounds) {
      if (!r.startsAt) continue;
      list.push({
        at: r.startsAt,
        kind: r.type === 'OA' ? 'Test' : 'Interview',
        label: `${d.company.name}: ${r.name}`,
        driveId: d.id,
      });
    }
    return list;
  });

  const byDay = new Map<string, typeof events>();
  for (const e of events) {
    const k = dayKey(e.at);
    byDay.set(k, [...(byDay.get(k) ?? []), e]);
  }

  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // weeks start Monday
  const cells = [
    ...Array<null>(lead).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const upcoming = events
    .filter((e) => e.at.getTime() >= today.getTime())
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, 8);

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <h1 className="display text-[clamp(1.7rem,3.6vw,2.3rem)]">Calendar</h1>
      <p className="mt-2 text-muted">
        Tests, interviews and closing dates for drives you qualify for. Click one to open the drive
        and apply.
      </p>

      {events.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<CalendarDays size={20} />}
            title="Nothing scheduled"
            body={
              student.cgpa === null
                ? 'Add your branch and CGPA so the portal knows which drives apply to you.'
                : 'Dates appear here once the placement cell publishes a drive you qualify for.'
            }
          />
        </div>
      ) : (
        <>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            {(Object.keys(KIND_COLOR) as Kind[]).map((k) => (
              <li key={k} className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: KIND_COLOR[k] }}
                  aria-hidden
                />
                {k}
              </li>
            ))}
          </ul>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px] lg:items-start">
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              <div className="border-b px-5 py-4">
                <h2 className="font-display text-lg">
                  {first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </h2>
              </div>
              <div className="grid grid-cols-7 border-b bg-surface-2 text-center text-xs text-muted">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <div key={d} className="py-2">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {cells.map((day, i) => {
                  if (day === null)
                    return <div key={`pad-${i}`} className="min-h-[84px] border-b border-r" />;
                  const date = new Date(today.getFullYear(), today.getMonth(), day);
                  const dayEvents = byDay.get(dayKey(date)) ?? [];
                  const isToday = day === today.getDate();
                  return (
                    <div
                      key={day}
                      className={`min-h-[84px] border-b border-r p-1.5 ${isToday ? 'bg-blue-wash' : ''}`}
                    >
                      <span
                        className={`tnum inline-grid size-6 place-items-center rounded-full text-xs ${
                          isToday ? 'bg-blue font-semibold text-on-blue' : 'text-muted'
                        }`}
                      >
                        {day}
                      </span>
                      <ul className="mt-1 space-y-1">
                        {dayEvents.slice(0, 2).map((e, j) => (
                          <li key={j}>
                            <Link
                              href={`/drives/${e.driveId}`}
                              className="block truncate rounded px-1 py-0.5 text-[10px] leading-tight hover:underline"
                              style={{
                                background: `color-mix(in oklab, ${KIND_COLOR[e.kind]} 18%, transparent)`,
                              }}
                              title={e.label}
                            >
                              {e.label}
                            </Link>
                          </li>
                        ))}
                        {dayEvents.length > 2 && (
                          <li className="tnum px-1 text-[10px] text-faint">
                            +{dayEvents.length - 2} more
                          </li>
                        )}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            <aside>
              <h2 className="font-semibold">Next up</h2>
              {upcoming.length === 0 ? (
                <p className="mt-4 rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
                  Nothing ahead this season.
                </p>
              ) : (
                <ol className="mt-4 space-y-3">
                  {upcoming.map((e, i) => (
                    <li key={i} className="flex gap-3 rounded-xl border border-line bg-surface p-3">
                      <span
                        className="mt-1 size-2.5 shrink-0 rounded-full"
                        style={{ background: KIND_COLOR[e.kind] }}
                        aria-hidden
                      />
                      <span className="min-w-0">
                        <Link
                          href={`/drives/${e.driveId}`}
                          className="block text-sm hover:text-blue"
                        >
                          {e.label}
                        </Link>
                        <span className="tnum mt-0.5 block text-xs text-muted">
                          {e.kind}, {longDate(e.at.toISOString())}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
