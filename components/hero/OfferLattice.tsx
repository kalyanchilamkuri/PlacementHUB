'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { lpa, mulberry32 } from '@/lib/utils';

/** One recorded offer. Kept deliberately plain so any query shape can feed it. */
export type LatticeOffer = { company: string; branch: string | null; ctc: number };

const CELL = 24;
const HIGH_BAND = 4_000_000;

type Cell = { x: number; y: number; col: number; offer: LatticeOffer | null };

/**
 * One via per student in the season cohort; lit vias are the offers made.
 * The lattice doubles as the jali screen the rest of the page is built on —
 * it is the dataset, not an ornament.
 */
export function OfferLattice({
  offers,
  cohort,
  cols: maxCols = 42,
}: {
  offers: LatticeOffer[];
  cohort: number;
  cols?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const box = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(maxCols);

  // Narrow containers get fewer, larger vias rather than an unreadable mesh.
  // First render matches the server at maxCols; the observer adjusts after mount.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry?.contentRect.width ?? 0;
      setCols(Math.max(14, Math.min(maxCols, Math.floor(w / 22))));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxCols]);

  const { cells, rows } = useMemo(() => {
    const rows = Math.ceil(cohort / cols);
    const total = rows * cols;
    // Deterministic scatter so the server and client agree on every dot.
    const rand = mulberry32(0x11171);
    const order = Array.from({ length: total }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j]!, order[i]!];
    }
    const lit = new Map<number, LatticeOffer>();
    offers.forEach((o, i) => {
      if (i < order.length) lit.set(order[i]!, o);
    });

    const cells: Cell[] = Array.from({ length: total }, (_, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        col,
        x: col * CELL + CELL / 2,
        y: row * CELL + CELL / 2,
        offer: lit.get(i) ?? null,
      };
    });
    return { cells, rows };
  }, [offers, cohort, cols]);

  const w = cols * CELL;
  const h = rows * CELL;
  const active = hover === null ? null : cells[hover];

  return (
    <div className="relative" ref={box}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full overflow-visible"
        role="img"
        aria-label={`${offers.length} offers made across a cohort of ${cohort} students this season.`}
        onMouseLeave={() => setHover(null)}
      >
        {/* Bus lines: the board the vias are seated on. */}
        <g stroke="var(--line)" strokeWidth={0.6} opacity={0.5}>
          {Array.from({ length: rows }, (_, r) => (
            <line key={r} x1={0} x2={w} y1={r * CELL + CELL / 2} y2={r * CELL + CELL / 2} />
          ))}
        </g>

        <g>
          {cells.map((c, i) => {
            const isHigh = c.offer && c.offer.ctc >= HIGH_BAND;
            const tone = isHigh ? 'var(--arch)' : 'var(--trace)';
            const delay = `${c.col * 17 + (i % 7) * 9}ms`;
            return (
              <g
                key={i}
                style={{
                  animation: 'via-light .42s cubic-bezier(.2,.8,.3,1) both',
                  animationDelay: delay,
                  transformOrigin: `${c.x}px ${c.y}px`,
                }}
                onMouseEnter={c.offer ? () => setHover(i) : undefined}
              >
                {c.offer && (
                  <circle cx={c.x} cy={c.y} r={8} fill={tone} opacity={hover === i ? 0.3 : 0.14} />
                )}
                <circle
                  cx={c.x}
                  cy={c.y}
                  r={c.offer ? (hover === i ? 4.6 : 3.4) : 1.5}
                  fill={c.offer ? tone : 'var(--faint)'}
                  opacity={c.offer ? 1 : 0.34}
                  style={{ transition: 'r .15s ease' }}
                />
              </g>
            );
          })}
        </g>
      </svg>

      {active?.offer && (
        <div
          className="glass-deep pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-xl px-3 py-2 text-xs"
          style={{
            left: `${((active.x / w) * 100).toFixed(2)}%`,
            top: `${((active.y / h) * 100).toFixed(2)}%`,
            marginTop: -14,
          }}
        >
          <div className="font-medium">{active.offer.company}</div>
          <div className="tnum mt-0.5 text-muted">
            {active.offer.branch}, {lpa(active.offer.ctc)}
          </div>
        </div>
      )}
    </div>
  );
}

export function LatticeLegend({ high, made }: { high: number; made: number }) {
  const items = [
    { tone: 'var(--arch)', label: `${high} at 40 LPA and above` },
    { tone: 'var(--trace)', label: `${made} offers made` },
    { tone: 'var(--faint)', label: 'Still interviewing' },
  ];
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-2">
          <span
            className="size-2 rounded-full"
            style={{ background: i.tone }}
            aria-hidden
          />
          {i.label}
        </li>
      ))}
    </ul>
  );
}
