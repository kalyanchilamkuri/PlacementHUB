import type { Metadata } from 'next';
import { PlacementsView } from '@/components/app/PlacementsView';

export const metadata: Metadata = { title: 'Placements' };

export default async function PlacementsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year } = await searchParams;
  return <PlacementsView year={year} basePath="/placements" />;
}
