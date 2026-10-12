import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/dal';
import { PlacementsView } from '@/components/app/PlacementsView';

export const metadata: Metadata = { title: 'Placements' };

export default async function AdminPlacementsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  await requireAdmin();
  const { year } = await searchParams;
  return <PlacementsView year={year} basePath="/admin/placements" />;
}
