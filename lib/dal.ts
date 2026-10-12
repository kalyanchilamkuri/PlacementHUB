import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { auth } from './auth';
import { db } from './db';

/**
 * The Data Access Layer.
 *
 * proxy.ts only does an optimistic cookie check — the installed Next.js docs
 * (01-app/02-guides/authentication.md) are explicit that proxy is not an
 * authorization solution, and that a check in a layout is not a guard either,
 * because layouts do not re-render on navigation and do not control whether
 * child segments render.
 *
 * So every page and every server action calls one of these. A page that forgets
 * is an open page.
 */

export const getSession = cache(async () => auth());

export const verifySession = cache(async () => {
  const session = await getSession();
  if (!session?.user?.id) redirect('/login');
  return {
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    image: session.user.image ?? null,
  };
});

export const requireAdmin = cache(async () => {
  const session = await verifySession();
  if (session.role !== 'ADMIN') redirect('/dashboard');
  return session;
});

export const requireStudent = cache(async () => {
  const session = await verifySession();
  const student = await db.student.findUnique({
    where: { userId: session.userId },
    include: { branch: true },
  });
  // Admins have no student row; send them where they belong.
  if (!student) redirect('/admin');
  return { ...session, student };
});
