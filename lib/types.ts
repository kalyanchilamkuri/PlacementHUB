/**
 * SQLite stores these as plain strings. These unions are the contract —
 * anything writing one of these columns must go through the values here.
 */

export const ROLES = ['ADMIN', 'STUDENT'] as const;
export type Role = (typeof ROLES)[number];

export const DRIVE_STATUSES = ['DRAFT', 'PUBLISHED', 'CLOSED', 'COMPLETED'] as const;
export type DriveStatus = (typeof DRIVE_STATUSES)[number];

export const DRIVE_TYPES = [
  'Full-time',
  'Internship',
  'Internship + Full-time',
  'PPO',
] as const;
export type DriveType = (typeof DRIVE_TYPES)[number];

export const ROUND_TYPES = ['PPT', 'OA', 'GD', 'TECH', 'HR'] as const;
export type RoundType = (typeof ROUND_TYPES)[number];

export const ROUND_TYPE_LABEL: Record<RoundType, string> = {
  PPT: 'Pre-placement talk',
  OA: 'Online assessment',
  GD: 'Group discussion',
  TECH: 'Technical interview',
  HR: 'HR interview',
};

export const RESULTS = ['PENDING', 'PASS', 'FAIL'] as const;
export type RoundResultValue = (typeof RESULTS)[number];

/** Application stage. Everything except APPLIED is derived in lib/stage.ts. */
export const STAGES = ['APPLIED', 'IN_PROGRESS', 'OFFER', 'REJECTED'] as const;
export type Stage = (typeof STAGES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  APPLIED: 'Applied',
  IN_PROGRESS: 'In progress',
  OFFER: 'Offer',
  REJECTED: 'Not selected',
};

export const NOTICE_PRIORITIES = ['URGENT', 'NORMAL'] as const;
export type NoticePriority = (typeof NOTICE_PRIORITIES)[number];

export const NOTIFICATION_TYPES = [
  'DRIVE_PUBLISHED',
  'STAGE_CHANGED',
  'ROUND_SCHEDULED',
  'DEADLINE_SOON',
  'NOTICE',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Splits a comma-separated column into a trimmed list. */
export function fromCsv(value: string | null | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function toCsv(values: string[]): string {
  return values.map((s) => s.trim()).filter(Boolean).join(',');
}
