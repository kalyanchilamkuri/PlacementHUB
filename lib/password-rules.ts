/**
 * Shared between the server actions that enforce the rule and the forms that
 * state it. Deliberately separate from lib/password.ts, which is server-only
 * because it does the hashing.
 */

export const PASSWORD_RULE = 'At least 10 characters.';

export function passwordProblem(password: string): string | null {
  if (password.length < 10) return 'Use at least 10 characters.';
  if (password.length > 200) return 'That is too long.';
  return null;
}
