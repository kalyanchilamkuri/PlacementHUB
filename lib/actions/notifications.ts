'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/dal';

export async function markAllRead() {
  const session = await verifySession();

  await db.notification.updateMany({
    // Scoped to the caller: nobody can clear someone else's bell.
    where: { userId: session.userId, readAt: null },
    data: { readAt: new Date() },
  });

  // The bell lives in the layout, which does not re-render on navigation, so the
  // layout itself has to be revalidated or the count would stay stale.
  revalidatePath('/', 'layout');
}

export async function markRead(id: string) {
  const session = await verifySession();
  await db.notification.updateMany({
    where: { id, userId: session.userId, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath('/', 'layout');
}
