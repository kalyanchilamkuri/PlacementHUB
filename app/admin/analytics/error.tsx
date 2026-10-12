'use client';

import { Button } from '@/components/ui/kit';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-line bg-surface p-8 text-center">
      <p className="display text-xl">That did not load</p>
      <p className="mt-2 text-sm text-muted">Something went wrong fetching placements. Try again in a moment.</p>
      <Button onClick={reset} className="mt-5">
        Try again
      </Button>
    </div>
  );
}
