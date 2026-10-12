import { requireAdmin } from '@/lib/dal';
import { signOutAction } from '@/lib/actions/auth';
import { Shell } from '@/components/app/Shell';

/**
 * Chrome only. Each admin page calls requireAdmin() itself — the installed
 * Next.js docs are explicit that a layout check is not an authorization
 * boundary.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { name, email, image } = await requireAdmin();

  return (
    <Shell
      variant="admin"
      kicker="Placement cell"
      signOut={signOutAction}
      user={{ name, email, image, subtitle: 'Placement cell' }}
    >
      {children}
    </Shell>
  );
}
