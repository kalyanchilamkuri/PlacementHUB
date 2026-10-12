import { redirect } from 'next/navigation';
import { getSession } from '@/lib/dal';

/** The portal is closed: land people where their role belongs. */
export default async function RootPage() {
  const session = await getSession();
  if (!session?.user) redirect('/login');
  redirect(session.user.role === 'ADMIN' ? '/admin' : '/dashboard');
}
