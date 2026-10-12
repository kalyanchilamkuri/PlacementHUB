'use client';

import { useTransition } from 'react';
import { setUserRole } from '@/lib/actions/admin';

export function RoleToggle({ userId, role }: { userId: string; role: 'ADMIN' | 'STUDENT' }) {
  const [pending, start] = useTransition();
  const next = role === 'ADMIN' ? 'STUDENT' : 'ADMIN';

  return (
    <button
      onClick={() => start(() => void setUserRole(userId, next))}
      disabled={pending}
      className="rounded-full border border-line px-3 py-1 text-xs text-muted transition-colors hover:border-blue hover:text-blue disabled:opacity-50"
    >
      {pending ? 'Saving' : next === 'ADMIN' ? 'Make admin' : 'Make student'}
    </button>
  );
}
