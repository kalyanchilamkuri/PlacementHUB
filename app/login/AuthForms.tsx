'use client';

import { useActionState } from 'react';
import { createFirstAdmin, signInWithPassword } from '@/lib/actions/auth';
import { PASSWORD_RULE } from '@/lib/password-rules';
import { Button, FormError } from '@/components/ui/kit';

const FIELD =
  'h-11 w-full rounded-[10px] border border-line bg-bg px-3 text-sm placeholder:text-faint focus:border-blue focus:outline-none';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function SignInForm({ domain, from }: { domain: string; from: string }) {
  const [state, action, pending] = useActionState(signInWithPassword, null);

  return (
    <form action={action} className="mt-7 space-y-4">
      <input type="hidden" name="from" value={from} />

      <Field label="Institute email">
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className={FIELD}
          placeholder={`you@${domain}`}
        />
      </Field>

      <Field label="Password">
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={FIELD}
        />
      </Field>

      {state && !state.ok && <FormError>{state.error}</FormError>}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Signing in' : 'Sign in'}
      </Button>
    </form>
  );
}

export function FirstAdminForm({ domain }: { domain: string }) {
  const [state, action, pending] = useActionState(createFirstAdmin, null);

  return (
    <form action={action} className="mt-7 space-y-4">
      <Field label="Your name">
        <input name="name" className={FIELD} placeholder="Placement cell" />
      </Field>

      <Field label="Institute email">
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className={FIELD}
          placeholder={`you@${domain}`}
        />
      </Field>

      <Field label="Password" hint={PASSWORD_RULE}>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className={FIELD}
        />
      </Field>

      <Field label="Password again">
        <input
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          className={FIELD}
        />
      </Field>

      {state && !state.ok && <FormError>{state.error}</FormError>}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Creating' : 'Create the cell account'}
      </Button>
    </form>
  );
}
