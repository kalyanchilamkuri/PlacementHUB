import type { Metadata } from 'next';
import { Users } from 'lucide-react';
import { requireAdmin } from '@/lib/dal';
import { getStudentStatuses } from '@/lib/placements';
import { ALLOWED_EMAIL_DOMAIN } from '@/lib/site';
import { EmptyState } from '@/components/ui/kit';
import { StudentDirectory } from './StudentDirectory';

export const metadata: Metadata = { title: 'Students' };

export default async function AdminStudentsPage() {
  await requireAdmin();
  const students = await getStudentStatuses();

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <h1 className="display text-[clamp(1.7rem,3.6vw,2.3rem)]">Students</h1>
      <p className="mt-2 max-w-[62ch] text-muted">
        Everyone registered, who has an offer and where. Tap a card to filter, a column to sort, a
        name to open their profile. Export downloads exactly what you see.
      </p>

      <div className="mt-6">
        {students.length === 0 ? (
          <EmptyState
            icon={<Users size={20} />}
            title="No students yet"
            body={`Nobody has signed in. Anyone with an @${ALLOWED_EMAIL_DOMAIN} address can register and fill in their profile.`}
          />
        ) : (
          <StudentDirectory rows={students} />
        )}
      </div>
    </div>
  );
}
