'use server';

import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { signIn, signOut } from '@/lib/auth';
import { db } from '@/lib/db';
import { ALLOWED_EMAIL_DOMAIN } from '@/lib/site';
import { hashPassword } from '@/lib/password';
import { passwordProblem } from '@/lib/password-rules';

export type AuthResult = { ok: true } | { ok: false; error: string };

const clean = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const emailOf = (f: FormData) => clean(f, 'email').toLowerCase();

function domainProblem(email: string) {
  if (!email) return 'Enter your institute email address.';
  if (!email.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`))
    return `Use your @${ALLOWED_EMAIL_DOMAIN} address.`;
  return null;
}

/* ------------------------------------------------------------- signing in */

export async function signInWithPassword(
  _prev: unknown,
  formData: FormData,
): Promise<AuthResult> {
  const email = emailOf(formData);
  const password = String(formData.get('password') ?? '');
  const from = clean(formData, 'from');

  if (!email || !password) return { ok: false, error: 'Enter your email and password.' };

  try {
    // redirect:false so a bad password returns here instead of throwing a redirect.
    await signIn('credentials', { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: 'That email and password do not match.' };
    }
    throw error;
  }

  redirect(from || '/');
}

export async function signOutAction() {
  await signOut({ redirectTo: '/login' });
}

/* ------------------------------------------------------- creating accounts */

/**
 * The first account on an empty portal becomes the placement cell. Guarded by
 * the user count, so it can only ever run once.
 */
export async function createFirstAdmin(
  _prev: unknown,
  formData: FormData,
): Promise<AuthResult> {
  if ((await db.user.count()) > 0) {
    return { ok: false, error: 'An account already exists. Sign in instead.' };
  }

  const email = emailOf(formData);
  const domainIssue = domainProblem(email);
  if (domainIssue) return { ok: false, error: domainIssue };

  const password = String(formData.get('password') ?? '');
  const pwIssue = passwordProblem(password);
  if (pwIssue) return { ok: false, error: pwIssue };
  if (password !== String(formData.get('confirm') ?? ''))
    return { ok: false, error: 'The two passwords do not match.' };

  await db.user.create({
    data: {
      email,
      name: clean(formData, 'name') || null,
      passwordHash: await hashPassword(password),
      role: 'ADMIN',
    },
  });

  await signIn('credentials', { email, password, redirect: false });
  redirect('/admin');
}

export async function registerStudent(
  _prev: unknown,
  formData: FormData,
): Promise<AuthResult> {
  const email = emailOf(formData);
  const domainIssue = domainProblem(email);
  if (domainIssue) return { ok: false, error: domainIssue };

  const password = String(formData.get('password') ?? '');
  const pwIssue = passwordProblem(password);
  if (pwIssue) return { ok: false, error: pwIssue };
  if (password !== String(formData.get('confirm') ?? ''))
    return { ok: false, error: 'The two passwords do not match.' };

  if (await db.user.findUnique({ where: { email } })) {
    return { ok: false, error: 'An account already exists for that address. Sign in instead.' };
  }

  await db.user.create({
    data: {
      email,
      name: clean(formData, 'name') || null,
      passwordHash: await hashPassword(password),
      role: 'STUDENT',
      student: { create: {} },
    },
  });

  await signIn('credentials', { email, password, redirect: false });
  redirect('/dashboard');
}
