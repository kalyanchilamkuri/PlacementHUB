import type { Metadata } from 'next';
import { Briefcase } from 'lucide-react';
import { requireStudent } from '@/lib/dal';
import { visibleDrives } from '@/lib/queries';
import { EmptyState } from '@/components/ui/kit';
import { DrivesBrowser } from './DrivesBrowser';

export const metadata: Metadata = { title: 'Drives' };

export default async function DrivesPage() {
  const { student } = await requireStudent();
  const list = await visibleDrives(student);

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <h1 className="display text-[clamp(1.7rem,3.6vw,2.3rem)]">Drives</h1>
      <p className="mt-2 text-muted">
        Everything the placement cell has published. Eligibility is checked against your profile.
      </p>

      {list.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Briefcase size={20} />}
            title="No drives published yet"
            body="When the placement cell publishes a drive it appears here, with whether you qualify for it."
          />
        </div>
      ) : (
        <DrivesBrowser list={list} />
      )}
    </div>
  );
}
