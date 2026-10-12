'use client';

import { useTransition } from 'react';
import { CircleCheck } from 'lucide-react';
import { setStudentVerified } from '@/lib/actions/admin';

export function VerifyToggle({ studentId, verified }: { studentId: string; verified: boolean }) {
  const [pending, start] = useTransition();

  return (
    <button
      onClick={() => start(() => void setStudentVerified(studentId, !verified))}
      disabled={pending}
      aria-pressed={verified}
      className={
        verified
          ? 'inline-flex items-center gap-1.5 rounded-full border border-ok/25 bg-trace-wash px-2.5 py-0.5 text-xs font-medium text-ok disabled:opacity-50'
          : 'inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-0.5 text-xs text-muted transition-colors hover:border-blue hover:text-blue disabled:opacity-50'
      }
    >
      <CircleCheck size={12} />
      {verified ? 'Verified' : 'Mark verified'}
    </button>
  );
}
