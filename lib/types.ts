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

/* --------------------------------------------------------------- offers */

export const OFFER_TYPES = [
  '2_MONTH_INTERN',
  '6_MONTH_INTERN',
  'WINTER_INTERN',
  'FULL_TIME',
  'PPO',
] as const;
export type OfferType = (typeof OFFER_TYPES)[number];

export const OFFER_TYPE_LABEL: Record<OfferType, string> = {
  '2_MONTH_INTERN': '2-month intern',
  '6_MONTH_INTERN': '6-month intern',
  WINTER_INTERN: 'Winter intern',
  FULL_TIME: 'Full-time',
  PPO: 'Full-time (PPO)',
};

/** Which offer types belong to which year of study. */
export const YEAR_OFFER_TYPES: Record<3 | 4, OfferType[]> = {
  3: ['2_MONTH_INTERN', '6_MONTH_INTERN'],
  4: ['WINTER_INTERN', 'PPO', 'FULL_TIME'],
};

export const DRIVE_TYPE_TO_OFFER_TYPE: Record<string, OfferType> = {
  'Full-time': 'FULL_TIME',
  Internship: '2_MONTH_INTERN',
  'Internship + Full-time': '6_MONTH_INTERN',
  PPO: 'PPO',
};

export function offerTypeOf(value: string | null | undefined): OfferType {
  return (OFFER_TYPES as readonly string[]).includes(value ?? '')
    ? (value as OfferType)
    : 'FULL_TIME';
}

/**
 * PPO is not a separate kind of offer: it is a full-time offer that an
 * internship turned into. For counting and colouring they are one group.
 */
export const OFFER_GROUPS = ['2_MONTH', '6_MONTH', 'WINTER', 'FULL_TIME'] as const;
export type OfferGroup = (typeof OFFER_GROUPS)[number];

export const GROUP_LABEL: Record<OfferGroup, string> = {
  '2_MONTH': '2-month interns',
  '6_MONTH': '6-month interns',
  WINTER: 'Winter interns',
  FULL_TIME: 'Full-time',
};

export const GROUP_SINGULAR: Record<OfferGroup, string> = {
  '2_MONTH': '2-month intern',
  '6_MONTH': '6-month intern',
  WINTER: 'Winter intern',
  FULL_TIME: 'Full-time',
};

export function offerGroup(t: OfferType | string): OfferGroup {
  switch (t) {
    case '2_MONTH_INTERN':
      return '2_MONTH';
    case '6_MONTH_INTERN':
      return '6_MONTH';
    case 'WINTER_INTERN':
      return 'WINTER';
    default:
      return 'FULL_TIME';
  }
}

export const isIntern = (t: string) => offerGroup(t) !== 'FULL_TIME';

/** Academic year starts in June. Returns the batch (graduation year) of each year of study. */
export function batchesByYear(now = new Date()) {
  const start = now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1;
  return { 4: start + 1, 3: start + 2, 2: start + 3, 1: start + 4 } as const;
}

export function yearLabelOfBatch(batch: number | null, now = new Date()): string {
  if (!batch) return 'Unknown';
  const by = batchesByYear(now);
  if (batch === by[4]) return '4th year';
  if (batch === by[3]) return '3rd year';
  if (batch === by[2]) return '2nd year';
  if (batch === by[1]) return '1st year';
  return batch < by[4] ? 'Passed out' : 'Unknown';
}
