import { cn } from '@/lib/utils';
import { OFFER_TYPE_LABEL, offerTypeOf } from '@/lib/types';

const STYLE: Record<string, string> = {
  FULL_TIME: 'text-o-full border-o-full/30 bg-[color-mix(in_oklab,var(--o-full)_12%,transparent)]',
  '6_MONTH_INTERN': 'text-o-6m border-o-6m/30 bg-[color-mix(in_oklab,var(--o-6m)_12%,transparent)]',
  '2_MONTH_INTERN': 'text-o-2m border-o-2m/30 bg-[color-mix(in_oklab,var(--o-2m)_12%,transparent)]',
  WINTER_INTERN: 'text-o-winter border-o-winter/30 bg-[color-mix(in_oklab,var(--o-winter)_14%,transparent)]',
  PPO: 'text-o-full border-o-full/30 bg-[color-mix(in_oklab,var(--o-full)_12%,transparent)]',
};

export const OFFER_DOT: Record<string, string> = {
  FULL_TIME: 'bg-o-full',
  '6_MONTH_INTERN': 'bg-o-6m',
  '2_MONTH_INTERN': 'bg-o-2m',
  WINTER_INTERN: 'bg-o-winter',
  PPO: 'bg-o-full',
};

export const OFFER_HEX: Record<string, string> = {
  FULL_TIME: 'var(--o-full)',
  '6_MONTH_INTERN': 'var(--o-6m)',
  '2_MONTH_INTERN': 'var(--o-2m)',
  WINTER_INTERN: 'var(--o-winter)',
  PPO: 'var(--o-full)',
};

export function OfferBadge({
  type,
  convertedFrom,
  className,
}: {
  type: string;
  convertedFrom?: string | null;
  className?: string;
}) {
  const t = offerTypeOf(type);
  if (t === 'PPO' && convertedFrom) {
    const from = offerTypeOf(convertedFrom);
    return (
      <span className={cn('inline-flex flex-wrap items-center gap-1', className)}>
        <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium', STYLE[from])}>
          <span className={cn('size-1.5 rounded-full', OFFER_DOT[from])} aria-hidden />
          {OFFER_TYPE_LABEL[from]}
        </span>
        <span className="text-faint" aria-hidden>→</span>
        <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold', STYLE.PPO)}>
          <span className={cn('size-1.5 rounded-full', OFFER_DOT.PPO)} aria-hidden />
          Converted to full-time
        </span>
      </span>
    );
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium',
        STYLE[t],
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', OFFER_DOT[t])} aria-hidden />
      {OFFER_TYPE_LABEL[t]}
    </span>
  );
}
