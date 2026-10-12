import { cn } from '@/lib/utils';
import type { Stage } from '@/lib/types';

type Round = { id: string; name: string };
type Result = { roundId: string; result: string };

/**
 * The trace rail doing its real job: a run of vias, one per round of this
 * drive, lit as far as the student has got. Every state is named in words as
 * well as coloured.
 */
export function Stepper({
  rounds,
  results,
  stage,
}: {
  rounds: Round[];
  results: Result[];
  stage: Stage;
}) {
  const byRound = new Map(results.map((r) => [r.roundId, r.result]));

  // The first round with no result yet is the one they are waiting on.
  const currentIndex =
    stage === 'REJECTED' || stage === 'OFFER'
      ? -1
      : rounds.findIndex((r) => (byRound.get(r.id) ?? 'PENDING') === 'PENDING');

  const nodes = [
    { key: 'applied', label: 'Applied', tone: 'done' as const },
    ...rounds.map((r, i) => {
      const result = byRound.get(r.id) ?? 'PENDING';
      const tone =
        result === 'PASS'
          ? ('done' as const)
          : result === 'FAIL'
            ? ('failed' as const)
            : i === currentIndex
              ? ('current' as const)
              : ('todo' as const);
      return { key: r.id, label: r.name, tone };
    }),
    {
      key: 'offer',
      label: 'Offer',
      tone:
        stage === 'OFFER' ? ('done' as const) : stage === 'REJECTED' ? ('todo' as const) : ('todo' as const),
    },
  ];

  return (
    <ol className="no-scrollbar flex items-start gap-0 overflow-x-auto pb-1">
      {nodes.map((n, i) => (
        <li key={n.key} className="flex shrink-0 items-start">
          <span className="flex w-[84px] flex-col items-center gap-1.5 sm:w-[104px]">
            <span
              className={cn(
                'size-3.5 rounded-full border-2 transition-colors',
                n.tone === 'done' && 'border-trace bg-trace',
                n.tone === 'current' && 'border-blue bg-blue ring-4 ring-blue/20',
                n.tone === 'failed' && 'border-bad bg-bad',
                n.tone === 'todo' && 'border-line bg-surface',
              )}
              aria-hidden
            />
            <span
              className={cn(
                'text-center text-[11px] leading-tight',
                n.tone === 'current' && 'font-medium text-blue',
                n.tone === 'failed' && 'font-medium text-bad',
                n.tone === 'done' && 'text-muted',
                n.tone === 'todo' && 'text-faint',
              )}
            >
              {n.label}
            </span>
          </span>
          {i < nodes.length - 1 && (
            <span
              className={cn('mt-[7px] h-px w-4 sm:w-6', n.tone === 'done' ? 'bg-trace' : 'bg-line')}
              aria-hidden
            />
          )}
        </li>
      ))}
    </ol>
  );
}
