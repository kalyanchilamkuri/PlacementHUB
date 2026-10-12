import { Check, Flag, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Stage } from '@/lib/types';

/** Applied -> each round -> Offer, drawn as a road that fills as the student moves along it. */
export function JourneyRoad({
  rounds,
  results,
  stage,
}: {
  rounds: { id: string; name: string }[];
  results: { roundId: string; result: string }[];
  stage: Stage;
}) {
  const byRound = new Map(results.map((r) => [r.roundId, r.result]));
  const nodes = [
    { label: 'Applied', state: 'done' as const },
    ...rounds.map((r) => {
      const res = byRound.get(r.id);
      return { label: r.name, state: res === 'PASS' ? ('done' as const) : res === 'FAIL' ? ('failed' as const) : ('todo' as const) };
    }),
    { label: 'Offer', state: stage === 'OFFER' ? ('done' as const) : ('todo' as const) },
  ];

  // The first todo node is where the student is standing now.
  const failed = nodes.findIndex((n) => n.state === 'failed');
  const current = failed === -1 ? nodes.findIndex((n) => n.state === 'todo') : -1;
  const reached = failed !== -1 ? failed : current === -1 ? nodes.length - 1 : current;
  const pct = nodes.length > 1 ? (Math.max(0, reached) / (nodes.length - 1)) * 100 : 0;

  return (
    <div className="relative px-3 pb-7 pt-1">
      <div className="absolute inset-x-8 top-[18px] h-1 rounded-full bg-line" aria-hidden />
      <div
        className={cn(
          'grow-x absolute left-8 top-[18px] h-1 rounded-full',
          failed !== -1 ? 'bg-bad' : 'bg-trace',
        )}
        style={{ width: `calc((100% - 4rem) * ${pct / 100})` }}
        aria-hidden
      />
      <ol className="relative flex justify-between">
        {nodes.map((n, i) => {
          const isCurrent = i === current;
          return (
            <li key={i} className="flex w-0 flex-1 flex-col items-center first:items-start last:items-end">
              <span
                className={cn(
                  'grid size-9 place-items-center rounded-full border-2 bg-surface transition-colors',
                  n.state === 'done' && 'border-trace bg-trace text-white',
                  n.state === 'failed' && 'border-bad bg-bad text-white',
                  n.state === 'todo' && !isCurrent && 'border-line text-faint',
                  isCurrent && 'ping-soft border-blue text-blue',
                )}
              >
                {n.state === 'done' ? (
                  i === nodes.length - 1 ? <Flag size={16} /> : <Check size={17} />
                ) : n.state === 'failed' ? (
                  <X size={17} />
                ) : (
                  <span className="tnum text-xs">{i + 1}</span>
                )}
              </span>
              <span
                className={cn(
                  'mt-2 max-w-[88px] text-center text-xs leading-tight',
                  isCurrent ? 'font-medium text-blue' : n.state === 'failed' ? 'text-bad' : 'text-muted',
                )}
              >
                {n.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
