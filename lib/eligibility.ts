import { fromCsv } from './types';

/** Only the fields the rules actually read, so both server and client can use it. */
export type EligibilityRules = {
  branchCodes: string;
  minCgpa: number;
  maxBacklogs: number;
  minTenthPct: number | null;
  minTwelfthPct: number | null;
};

export type Candidate = {
  branchCode: string | null;
  cgpa: number | null;
  activeBacklogs: number;
  tenthPct: number | null;
  twelfthPct: number | null;
};

export type Eligibility =
  | { eligible: true }
  | {
      eligible: false;
      reason: string;
      kind: 'profile' | 'branch' | 'cgpa' | 'backlog' | 'marks';
    };

/**
 * The single source of truth for who can apply. The drive card badge, the apply
 * button, the eligibility checklist and the calendar filter all call this, so
 * they cannot disagree. Reasons are written for the student to act on.
 */
export function checkEligibility(rules: EligibilityRules, me: Candidate): Eligibility {
  if (me.cgpa === null || me.branchCode === null) {
    return {
      eligible: false,
      kind: 'profile',
      reason: 'Add your branch and CGPA to your profile first',
    };
  }

  const branches = fromCsv(rules.branchCodes);
  if (branches.length > 0 && !branches.includes(me.branchCode)) {
    return {
      eligible: false,
      kind: 'branch',
      reason: `Open to ${branches.join(', ')} only`,
    };
  }

  if (me.cgpa < rules.minCgpa) {
    return {
      eligible: false,
      kind: 'cgpa',
      reason: `Needs ${rules.minCgpa.toFixed(1)} CGPA — yours is ${me.cgpa.toFixed(2)}`,
    };
  }

  if (me.activeBacklogs > rules.maxBacklogs) {
    return {
      eligible: false,
      kind: 'backlog',
      reason:
        rules.maxBacklogs === 0
          ? 'No active backlogs allowed'
          : `At most ${rules.maxBacklogs} active backlog allowed`,
    };
  }

  if (rules.minTenthPct !== null && (me.tenthPct ?? 0) < rules.minTenthPct) {
    return {
      eligible: false,
      kind: 'marks',
      reason: `Needs ${rules.minTenthPct}% in class 10 — yours is ${me.tenthPct ?? 0}%`,
    };
  }

  if (rules.minTwelfthPct !== null && (me.twelfthPct ?? 0) < rules.minTwelfthPct) {
    return {
      eligible: false,
      kind: 'marks',
      reason: `Needs ${rules.minTwelfthPct}% in class 12 — yours is ${me.twelfthPct ?? 0}%`,
    };
  }

  return { eligible: true };
}
