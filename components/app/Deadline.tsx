'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { longDate, untilDeadline } from '@/lib/utils';
import { Badge } from '@/components/ui/kit';

/**
 * Renders the absolute date on the server, then swaps to a countdown once
 * mounted — "3 days left" cannot be computed identically on both sides.
 */
export function Deadline({ iso, className }: { iso: string; className?: string }) {
  const [rel, setRel] = useState<ReturnType<typeof untilDeadline> | null>(null);

  useEffect(() => {
    const update = () => setRel(untilDeadline(iso));
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, [iso]);

  if (!rel) {
    return (
      <span className={className}>
        <Badge tone="neutral">
          <Clock size={12} />
          Closes {longDate(iso)}
        </Badge>
      </span>
    );
  }

  return (
    <span className={className}>
      <Badge tone={rel.closed ? 'neutral' : rel.urgent ? 'bad' : 'warn'}>
        <Clock size={12} />
        {rel.text}
      </Badge>
    </span>
  );
}
