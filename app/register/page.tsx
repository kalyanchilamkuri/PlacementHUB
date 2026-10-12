import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { ALLOWED_EMAIL_DOMAIN } from '@/lib/site';
import { getSession } from '@/lib/dal';
import { db } from '@/lib/db';
import { AuthShell } from '@/components/auth/AuthShell';
import { RegisterForm } from './RegisterForm';

export const metadata: Metadata = {
  title: 'Create a student account',
  description: 'Register for the IIIT Lucknow Training & Placement portal.',
};

export default async function RegisterPage() {
  const session = await getSession();
  if (session?.user) redirect('/');

  // Before the cell exists there is nobody to register with; send them to setup.
  if ((await db.user.count()) === 0) redirect('/login');

  return (
    <AuthShell
      title="Create your account"
      lead="Register with your institute address, then fill in your branch and CGPA so the portal can work out which drives you qualify for."
      footer={
        <p>
          Already registered?{' '}
          <Link href="/login" className="text-blue hover:underline">
            Sign in
          </Link>
          .
        </p>
      }
    >
      <RegisterForm domain={ALLOWED_EMAIL_DOMAIN} />
    </AuthShell>
  );
}
