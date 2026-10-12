import Link from 'next/link';
import type { Metadata } from 'next';
import { Bell, BriefcaseBusiness, CalendarClock, ListChecks, Megaphone } from 'lucide-react';
import { requireStudent } from '@/lib/dal';
import { db } from '@/lib/db';
import { syncDeadlineNotifications } from '@/lib/notify';
import { shortDate } from '@/lib/utils';
import type { NotificationType } from '@/lib/types';
import { EmptyState } from '@/components/ui/kit';
import { MarkAllRead } from './MarkAllRead';

export const metadata: Metadata = { title: 'Notifications' };

const ICON: Record<NotificationType, typeof Bell> = {
  DRIVE_PUBLISHED: BriefcaseBusiness,
  STAGE_CHANGED: ListChecks,
  ROUND_SCHEDULED: CalendarClock,
  DEADLINE_SOON: CalendarClock,
  NOTICE: Megaphone,
};

const TONE: Record<NotificationType, string> = {
  DRIVE_PUBLISHED: 'text-blue bg-blue-wash',
  STAGE_CHANGED: 'text-ok bg-trace-wash',
  ROUND_SCHEDULED: 'text-blue bg-blue-wash',
  DEADLINE_SOON: 'text-warn bg-arch-wash',
  NOTICE: 'text-muted bg-surface-2',
};

export default async function NotificationsPage() {
  const { student, userId } = await requireStudent();

  // No scheduler, so deadline reminders are worked out when the student looks.
  await syncDeadlineNotifications({ ...student, userId });

  const notifications = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 60,
  });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const today = notifications.filter((n) => n.createdAt >= startOfToday);
  const earlier = notifications.filter((n) => n.createdAt < startOfToday);
  const unread = notifications.filter((n) => n.readAt === null).length;

  const group = (label: string, items: typeof notifications) =>
    items.length === 0 ? null : (
      <section key={label}>
        <h2 className="mb-3 text-sm font-semibold text-muted">{label}</h2>
        <ul className="space-y-2">
          {items.map((n) => {
            const type = n.type as NotificationType;
            const Icon = ICON[type] ?? Bell;
            const body = (
              <>
                <span
                  className={`niche grid size-10 shrink-0 place-items-center border border-line ${
                    TONE[type] ?? 'bg-surface-2 text-muted'
                  }`}
                  aria-hidden
                >
                  <Icon size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{n.title}</span>
                    {n.readAt === null && (
                      <span className="size-1.5 shrink-0 rounded-full bg-blue" aria-label="Unread" />
                    )}
                  </span>
                  {n.body && (
                    <span className="mt-0.5 block text-sm leading-relaxed text-muted">{n.body}</span>
                  )}
                  <span className="tnum mt-1 block text-xs text-faint">
                    {shortDate(n.createdAt.toISOString())}
                  </span>
                </span>
              </>
            );

            return (
              <li key={n.id}>
                {n.href ? (
                  <Link
                    href={n.href}
                    className={`flex gap-4 rounded-2xl border bg-surface p-4 transition-colors hover:border-blue ${
                      n.readAt === null ? 'border-blue/30' : 'border-line'
                    }`}
                  >
                    {body}
                  </Link>
                ) : (
                  <div
                    className={`flex gap-4 rounded-2xl border bg-surface p-4 ${
                      n.readAt === null ? 'border-blue/30' : 'border-line'
                    }`}
                  >
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    );

  return (
    <div className="mx-auto w-full max-w-[760px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[clamp(1.7rem,3.6vw,2.3rem)]">Notifications</h1>
          <p className="mt-2 text-muted">
            {unread > 0 ? `${unread} unread.` : 'You are up to date.'}
          </p>
        </div>
        {unread > 0 && <MarkAllRead />}
      </div>

      <div className="mt-8 space-y-8">
        {notifications.length === 0 ? (
          <EmptyState
            icon={<Bell size={20} />}
            title="Nothing yet"
            body="You will hear here when a drive opens to you, when your application moves, and when a deadline is close."
          />
        ) : (
          <>
            {group('Today', today)}
            {group('Earlier', earlier)}
          </>
        )}
      </div>
    </div>
  );
}
