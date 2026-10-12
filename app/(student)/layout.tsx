import { requireStudent } from '@/lib/dal';
import { unreadCount } from '@/lib/notify';
import { signOutAction } from '@/lib/actions/auth';
import { Shell } from '@/components/app/Shell';

/**
 * The layout fetches the user for the chrome. It is not the guard — every page
 * underneath calls requireStudent() itself, because a layout does not control
 * whether its child segments render.
 */
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { name, email, image, student, userId } = await requireStudent();
  const unread = await unreadCount(userId);

  const subtitle =
    student.branchCode && student.batch
      ? `${student.branchCode}, batch ${student.batch}`
      : 'Complete your profile';

  return (
    <Shell
      variant="student"
      kicker="Placements"
      unread={unread}
      signOut={signOutAction}
      user={{ name, email, image, subtitle }}
    >
      {children}
    </Shell>
  );
}
