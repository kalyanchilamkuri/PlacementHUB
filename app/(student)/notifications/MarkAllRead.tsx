'use client';

import { useTransition } from 'react';
import { CheckCheck } from 'lucide-react';
import { markAllRead } from '@/lib/actions/notifications';
import { Button } from '@/components/ui/kit';

export function MarkAllRead() {
  const [pending, start] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => start(() => void markAllRead())}
    >
      <CheckCheck size={15} />
      {pending ? 'Clearing' : 'Mark all read'}
    </Button>
  );
}
