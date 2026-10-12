'use client';

import { useEffect } from 'react';
import { ExternalLink, Mail, X } from 'lucide-react';
import { OfferBadge } from '@/components/ui/OfferBadge';
import { Badge } from '@/components/ui/kit';
import { initials, offerMoney } from '@/lib/utils';

export type CardStudent = {
  name: string;
  rollNo: string | null;
  email?: string;
  branchCode: string | null;
  batch: number | null;
  cgpa: number | null;
  skills: string[];
  linkedinUrl: string | null;
  offers: { company: string; role: string; offerType: string; ctc: number; stipend?: number | null; isOnCampus: boolean }[];
};

export function StudentProfileCard({ student, onClose }: { student: CardStudent; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <button
        aria-label="Close"
        onClick={onClose}
        className="fade-in absolute inset-0 bg-[rgb(2_11_19/0.55)] backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${student.name}, profile`}
        className="pop glass-deep rim relative w-full max-w-md overflow-hidden rounded-3xl p-6"
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-4">
          <span className="niche grid size-16 shrink-0 place-items-center border border-line bg-blue-wash font-display text-xl text-blue">
            {initials(student.name)}
          </span>
          <div className="min-w-0">
            <h3 className="display truncate text-2xl">{student.name}</h3>
            <p className="tnum text-sm text-muted">{student.rollNo ?? 'Roll number not set'}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {student.branchCode && <Badge tone="info">{student.branchCode}</Badge>}
          {student.batch && <Badge>Batch {student.batch}</Badge>}
          {student.cgpa !== null && <Badge tone="accent">CGPA {student.cgpa.toFixed(2)}</Badge>}
        </div>

        {student.skills.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-faint">Skills</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {student.skills.map((s) => (
                <span key={s} className="rounded-md border border-line bg-surface-2 px-2 py-0.5 text-xs">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-faint">Placement</p>
          {student.offers.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No offers recorded yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {student.offers.map((o, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{o.company}</span>
                    <span className="block truncate text-xs text-muted">
                      {o.role}
                      {!o.isOnCampus && ' · off-campus'}
                      {offerMoney(o) && ` · ${offerMoney(o)}`}
                    </span>
                  </span>
                  <OfferBadge type={o.offerType} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {(student.email || student.linkedinUrl) && (
          <div className="mt-5 flex flex-wrap gap-4 text-sm">
            {student.email && (
              <a href={`mailto:${student.email}`} className="inline-flex items-center gap-1.5 text-blue hover:underline">
                <Mail size={14} /> {student.email}
              </a>
            )}
            {student.linkedinUrl && (
              <a
                href={student.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-blue hover:underline"
              >
                <ExternalLink size={14} /> LinkedIn
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
