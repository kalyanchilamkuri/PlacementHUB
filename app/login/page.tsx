import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { ALLOWED_EMAIL_DOMAIN } from '@/lib/site';
import { getSession } from '@/lib/dal';
import { db } from '@/lib/db';
import { AuthShell } from '@/components/auth/AuthShell';
import { FirstAdminForm, SignInForm } from './AuthForms';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to the IIIT Lucknow Training & Placement portal.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await getSession();
  if (session?.user) redirect('/');

  const { from = '' } = await searchParams;
  const isEmpty = (await db.user.count()) === 0;

  // Nothing exists yet, so the first person through the door is the cell.
  if (isEmpty) {
    return (
      <AuthShell
        title="Set up the portal"
        lead="No accounts exist yet. The first one belongs to the placement cell and can manage everything — companies, drives and applicants."
      >
        <FirstAdminForm domain={ALLOWED_EMAIL_DOMAIN} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Training &amp; Placement"
      lead="Students see the drives they are eligible for and track their applications. The placement cell manages the season."
      footer={
        <p>
          New here?{' '}
          <Link href="/register" className="text-blue hover:underline">
            Create a student account
          </Link>
          {' '}with your @{ALLOWED_EMAIL_DOMAIN} address.
        </p>
      }
    >
      <SignInForm domain={ALLOWED_EMAIL_DOMAIN} from={from} />
    </AuthShell>
  );
}
