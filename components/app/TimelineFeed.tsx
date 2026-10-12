import { PartyPopper } from 'lucide-react';
import { lpa } from '@/lib/utils';
import { OfferBadge } from '@/components/ui/OfferBadge';

export type TimelineItem = {
  id: string;
  message: string;
  ctc: number | null;
  offerType: string | null;
  at: string;
};

function ago(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} day${d === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function TimelineFeed({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line px-5 py-10 text-center text-sm text-muted">
        No placements announced yet. The first one will show up here.
      </p>
    );
  }
  return (
    <ol className="relative space-y-3 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-px before:bg-line">
      {items.map((e, i) => (
        <li
          key={e.id}
          className="arrive relative flex gap-4"
          style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
        >
          <span className="via relative z-10 mt-3 grid size-8 shrink-0 place-items-center rounded-full bg-arch-wash text-arch">
            <PartyPopper size={15} />
          </span>
          <div className="min-w-0 flex-1 rounded-2xl border border-line bg-surface px-4 py-3">
            <p className="text-sm">{e.message}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
              {e.offerType && <OfferBadge type={e.offerType} />}
              {e.ctc ? <span className="tnum font-medium text-ink">{lpa(e.ctc)}</span> : null}
              <span>{ago(e.at)}</span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
