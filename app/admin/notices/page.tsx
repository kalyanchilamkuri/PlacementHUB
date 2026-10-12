import type { Metadata } from 'next';
import { Megaphone } from 'lucide-react';
import { requireAdmin } from '@/lib/dal';
import { db } from '@/lib/db';
import { fromCsv } from '@/lib/types';
import { longDate } from '@/lib/utils';
import { Badge, EmptyState } from '@/components/ui/kit';
import { DeleteNoticeButton } from './DeleteNoticeButton';
import { NoticeForm } from './NoticeForm';

export const metadata: Metadata = { title: 'Notices' };

export default async function AdminNoticesPage() {
  await requireAdmin();

  const [notices, branches] = await Promise.all([
    db.notice.findMany({
      orderBy: { publishedAt: 'desc' },
      include: { createdBy: { select: { name: true, email: true } } },
    }),
    db.branch.findMany({
      orderBy: [{ programme: 'asc' }, { code: 'asc' }],
      select: { code: true, name: true },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <h1 className="display text-[clamp(1.7rem,3.6vw,2.3rem)]">Notices</h1>
      <p className="mt-2 text-muted">
        The noticeboard students actually read. Posting one also sends a notification.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <div>
          {notices.length === 0 ? (
            <EmptyState
              icon={<Megaphone size={20} />}
              title="Nothing posted yet"
              body="Use the form beside this. Urgent notices are pinned to the top of the students' board."
            />
          ) : (
            <ul className="space-y-3">
              {notices.map((n) => {
                const branches = fromCsv(n.branchCodes);
                return (
                  <li
                    key={n.id}
                    className={`rounded-2xl border bg-surface p-5 ${
                      n.priority === 'URGENT' ? 'border-bad/30' : 'border-line'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {n.priority === 'URGENT' && <Badge tone="bad">Urgent</Badge>}
                        <Badge tone="info">
                          {branches.length ? branches.join(', ') : 'Everyone'}
                        </Badge>
                        <span className="tnum text-xs text-faint">
                          {longDate(n.publishedAt.toISOString())}
                        </span>
                      </div>
                      <DeleteNoticeButton id={n.id} title={n.title} />
                    </div>

                    <h2 className="mt-3 font-medium">{n.title}</h2>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted">
                      {n.body}
                    </p>
                    {n.createdBy && (
                      <p className="mt-3 text-xs text-faint">
                        Posted by {n.createdBy.name ?? n.createdBy.email}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <NoticeForm branches={branches} />
      </div>
    </div>
  );
}
