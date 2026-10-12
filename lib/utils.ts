import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** All money is stored in rupees per annum; students read it as LPA. */
export function lpa(rupees: number) {
  if (rupees >= 1_00_00_000) {
    const cr = rupees / 1_00_00_000;
    return `${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  const l = rupees / 1_00_000;
  return `${l % 1 === 0 ? l.toFixed(0) : l.toFixed(1)} LPA`;
}

export function shortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function longDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** "in 3 days" / "closed" — deadlines are the thing students scan for. */
export function untilDeadline(iso: string, now = Date.now()) {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return { text: 'Closed', urgent: false, closed: true };
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return { text: `${Math.max(1, Math.floor(ms / 60_000))} min left`, urgent: true, closed: false };
  if (hours < 48) return { text: `${hours} hr left`, urgent: true, closed: false };
  return { text: `${Math.floor(hours / 24)} days left`, urgent: false, closed: false };
}

/** Deterministic PRNG so server and client render identical generated geometry. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function initials(name: string) {
  return name
    .replace(/[^A-Za-z0-9 ]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
}
