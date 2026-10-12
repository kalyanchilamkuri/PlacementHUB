import { cn } from '@/lib/utils';

/** The cusped arch from the institute crest, as a path in a 100×120 box. */
export const ARCH_PATH =
  'M0 120 L0 66 C0 28 23 4 50 0 C77 4 100 28 100 66 L100 120 Z';

/**
 * An arched niche. Company marks and portraits sit inside one of these rather
 * than inside yet another rounded rectangle.
 */
export function ArchNiche({
  children,
  className,
  tone = 'surface',
}: {
  children: React.ReactNode;
  className?: string;
  tone?: 'surface' | 'wash';
}) {
  return (
    <div
      className={cn(
        'niche relative grid place-items-center overflow-hidden border',
        tone === 'wash' ? 'bg-blue-wash' : 'bg-surface',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** A thin arch drawn in trace-green, used as a section ornament. */
export function ArchOutline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 120" className={className} aria-hidden fill="none">
      <path d={ARCH_PATH} stroke="currentColor" strokeWidth={1.4} />
      <path
        d="M14 120 L14 68 C14 38 30 18 50 14 C70 18 86 38 86 68 L86 120"
        stroke="currentColor"
        strokeWidth={0.7}
        strokeDasharray="2 5"
        opacity={0.7}
      />
    </svg>
  );
}
