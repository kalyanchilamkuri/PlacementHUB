import 'server-only';
import { db } from './db';
import { checkEligibility, type Candidate } from './eligibility';
import { lpa } from './utils';
import { fromCsv, type NotificationType } from './types';

/**
 * Every notification the portal emits is defined here, so "who is told what"
 * has one answer. Eligibility fan-out goes through checkEligibility, the same
 * function the drive list and the apply button use — a notification can
 * therefore never disagree with what the student actually sees.
 */

type NewNotification = {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string | null;
  href?: string | null;
  /** Repeated emits with the same key collapse into one. */
  dedupeKey?: string | null;
};

/**
 * Prisma's createMany has no skipDuplicates on SQLite, so keyed rows are
 * filtered against what already exists before inserting. Rows without a key are
 * always inserted.
 */
async function emit(items: NewNotification[]) {
  if (items.length === 0) return 0;

  const keys = [...new Set(items.map((n) => n.dedupeKey).filter(Boolean))] as string[];

  let taken = new Set<string>();
  if (keys.length > 0) {
    const existing = await db.notification.findMany({
      where: { dedupeKey: { in: keys } },
      select: { userId: true, dedupeKey: true },
    });
    taken = new Set(existing.map((e) => `${e.userId}::${e.dedupeKey}`));
  }

  const fresh = items.filter((n) => !n.dedupeKey || !taken.has(`${n.userId}::${n.dedupeKey}`));
  if (fresh.length === 0) return 0;

  try {
    const result = await db.notification.createMany({
      data: fresh.map((n) => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        body: n.body ?? null,
        href: n.href ?? null,
        dedupeKey: n.dedupeKey ?? null,
      })),
    });
    return result.count;
  } catch (error) {
    // Two tabs can race the check above. The unique index is the real guard, and
    // losing that race means the row already exists — which is the wanted state.
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      return 0;
    }
    throw error;
  }
}

/** Students with enough of a profile to be judged eligible for anything. */
async function candidates() {
  return db.student.findMany({
    select: {
      id: true,
      userId: true,
      branchCode: true,
      cgpa: true,
      activeBacklogs: true,
      tenthPct: true,
      twelfthPct: true,
    },
  });
}

function eligibleAmong<T extends Candidate>(
  drive: Parameters<typeof checkEligibility>[0],
  list: T[],
) {
  return list.filter((s) => checkEligibility(drive, s).eligible);
}

/* ------------------------------------------------------------- the events */

export async function notifyDrivePublished(driveId: string) {
  const drive = await db.drive.findUnique({
    where: { id: driveId },
    include: { company: { select: { name: true } } },
  });
  if (!drive || drive.status !== 'PUBLISHED') return 0;

  const reach = eligibleAmong(drive, await candidates());
  const package_ = drive.ctc ? ` — ${lpa(drive.ctc)}` : '';

  return emit(
    reach.map((s) => ({
      userId: s.userId,
      type: 'DRIVE_PUBLISHED' as const,
      title: `${drive.company.name} is open to you`,
      body: `${drive.role}${package_}. Applications close soon.`,
      href: `/drives/${drive.id}`,
      dedupeKey: `drive-published:${drive.id}`,
    })),
  );
}

/** Called after a round result is recorded, with the stage already recomputed. */
export async function notifyStageChanged(applicationId: string) {
  const application = await db.application.findUnique({
    where: { id: applicationId },
    include: {
      student: { select: { userId: true } },
      drive: { include: { company: { select: { name: true } } } },
    },
  });
  if (!application) return 0;

  const company = application.drive.company.name;
  const wording: Record<string, { title: string; body: string }> = {
    OFFER: {
      title: `You have an offer from ${company}`,
      body: 'Every round is cleared. Congratulations.',
    },
    REJECTED: {
      title: `${company} did not take you forward`,
      body: 'The next one is a fresh start.',
    },
    IN_PROGRESS: {
      title: `You cleared a round at ${company}`,
      body: 'Check your tracker for what is next.',
    },
    APPLIED: {
      title: `Your ${company} application was reset`,
      body: 'A round result was withdrawn.',
    },
  };

  const copy = wording[application.stage] ?? wording.IN_PROGRESS!;

  return emit([
    {
      userId: application.student.userId,
      type: 'STAGE_CHANGED',
      title: copy.title,
      body: copy.body,
      href: '/applications',
      // Keyed on the stage so each move is announced once, but moving back and
      // forth does not spam.
      dedupeKey: `stage:${applicationId}:${application.stage}`,
    },
  ]);
}

// A ROUND_SCHEDULED emit belongs here too, but there is no drive-edit screen yet
// for it to fire from, so it is left unwritten rather than unreachable.

export async function notifyNoticePublished(noticeId: string) {
  const notice = await db.notice.findUnique({ where: { id: noticeId } });
  if (!notice) return 0;

  const branches = fromCsv(notice.branchCodes);
  const students = await db.student.findMany({
    where: branches.length ? { branchCode: { in: branches } } : {},
    select: { userId: true },
  });

  return emit(
    students.map((s) => ({
      userId: s.userId,
      type: 'NOTICE' as const,
      title: notice.priority === 'URGENT' ? `Urgent: ${notice.title}` : notice.title,
      body: notice.body.slice(0, 160),
      href: '/notices',
      dedupeKey: `notice:${notice.id}`,
    })),
  );
}

/* ------------------------------------------------- deadlines, without cron */

const DAY = 24 * 60 * 60 * 1000;

/**
 * There is no job runner, so this is called when a student opens the portal.
 * The dedupe key makes it idempotent, so running it on every page load costs
 * one query and inserts nothing the second time.
 *
 * Known limit: it only reaches students who are already looking. Proper
 * reminders need a scheduler or email, which is a later piece of work.
 */
export async function syncDeadlineNotifications(student: Candidate & { id: string; userId: string }) {
  const now = Date.now();

  const closing = await db.drive.findMany({
    where: {
      status: 'PUBLISHED',
      deadline: { gt: new Date(now), lt: new Date(now + DAY) },
      applications: { none: { studentId: student.id } },
    },
    include: { company: { select: { name: true } } },
  });
  if (closing.length === 0) return 0;

  const mine = closing.filter((d) => checkEligibility(d, student).eligible);

  return emit(
    mine.map((d) => ({
      userId: student.userId,
      type: 'DEADLINE_SOON' as const,
      title: `${d.company.name} closes within a day`,
      body: `You qualify for ${d.role} but have not applied.`,
      href: `/drives/${d.id}`,
      dedupeKey: `deadline:${d.id}`,
    })),
  );
}

/* ------------------------------------------------------------- reading it */

export async function unreadCount(userId: string) {
  return db.notification.count({ where: { userId, readAt: null } });
}
