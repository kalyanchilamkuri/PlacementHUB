import type { Metadata } from 'next';
import { Megaphone } from 'lucide-react';
import { requireStudent } from '@/lib/dal';
import { db } from '@/lib/db';
import { longDate } from '@/lib/utils';
import { Badge, EmptyState } from '@/components/ui/kit';

export const metadata: Metadata = { title: 'Notices' };

export default async function NoticesPage() {
  const { student } = await requireStudent();

  // Untargeted notices reach everyone; targeted ones only their branch.
  const notices = await db.notice.findMany({
    where: {
      OR: [
        { branchCodes: '' },
        ...(student.branchCode ? [{ branchCodes: { contains: student.branchCode } }] : []),
      ],
    },
    orderBy: [{ priority: 'asc' }, { publishedAt: 'desc' }],
  });

  return (
    <div className="mx-auto w-full max-w-[860px]">
      <h1 className="display text-[clamp(1.7rem,3.6vw,2.3rem)]">Notices</h1>
      <p className="mt-2 text-muted">Everything the placement cell has posted for you.</p>

      <div className="mt-8">
        {notices.length === 0 ? (
          <EmptyState
            icon={<Megaphone size={20} />}
            title="Nothing posted yet"
            body="Notices from the placement cell appear here, and urgent ones are pinned to the top."
          />
        ) : (
          <ul className="space-y-3">
            {notices.map((n) => (
              <li
                key={n.id}
                className={`rounded-2xl border bg-surface p-5 ${
                  n.priority === 'URGENT' ? 'border-bad/30' : 'border-line'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  {n.priority === 'URGENT' && <Badge tone="bad">Urgent</Badge>}
                  <span className="tnum text-xs text-faint">
                    {longDate(n.publishedAt.toISOString())}
                  </span>
                </div>
                <h2 className="mt-2 font-medium">{n.title}</h2>
                <p className="mt-1.5 whitespace-pre-line text-sm leading-relaxed text-muted">
                  {n.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
