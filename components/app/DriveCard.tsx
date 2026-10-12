import Link from 'next/link';
import { MapPin } from 'lucide-react';
import type { Eligibility } from '@/lib/eligibility';
import { lpa } from '@/lib/utils';
import { Badge, Button, CompanyMark } from '@/components/ui/kit';
import { Deadline } from './Deadline';

export type DriveCardData = {
  id: string;
  role: string;
  type: string;
  ctc: number | null;
  minCgpa: number;
  locations: string | null;
  deadline: string;
  company: { name: string };
};

export function DriveCard({
  drive,
  eligibility,
  applied = false,
}: {
  drive: DriveCardData;
  eligibility: Eligibility;
  applied?: boolean;
}) {
  return (
    <article className="group relative flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 transition-colors duration-200 hover:border-blue sm:flex-row sm:items-start">
      <CompanyMark name={drive.company.name} size="lg" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">
            <Link href={`/drives/${drive.id}`} className="after:absolute after:inset-0">
              {drive.company.name}
            </Link>
          </h3>
          <Badge tone="neutral">{drive.type}</Badge>
          {applied && <Badge tone="info">Applied</Badge>}
        </div>

        <p className="mt-1 text-[15px]">{drive.role}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
          {drive.ctc !== null && (
            <span className="tnum font-medium text-ink">{lpa(drive.ctc)}</span>
          )}
          {drive.locations && (
            <span className="flex items-center gap-1.5">
              <MapPin size={14} />
              {drive.locations}
            </span>
          )}
          {drive.minCgpa > 0 && <span className="tnum">Needs {drive.minCgpa.toFixed(1)} CGPA</span>}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {eligibility.eligible ? (
            <Badge tone="ok">Eligible</Badge>
          ) : (
            <Badge tone="bad">Not eligible — {eligibility.reason}</Badge>
          )}
          <Deadline iso={drive.deadline} />
        </div>
      </div>

      <div className="relative z-10 shrink-0 self-end sm:self-center">
        <Button
          href={`/drives/${drive.id}`}
          variant={eligibility.eligible && !applied ? 'primary' : 'outline'}
          size="sm"
        >
          {applied ? 'View' : eligibility.eligible ? 'View and apply' : 'View drive'}
        </Button>
      </div>
    </article>
  );
}
