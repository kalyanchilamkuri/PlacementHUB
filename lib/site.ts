/**
 * Institute constants. Nothing here identifies a person, and nothing is copied
 * from the live site — every company, student, drive and contact is entered by
 * the placement cell inside the portal.
 */

export const INSTITUTE = {
  name: 'Indian Institute of Information Technology, Lucknow',
  shortName: 'IIIT Lucknow',
  initials: 'IIITL',
  motto: 'विद्या ददाति विनयं विनयाद् याति पात्रताम्',
  mottoGloss: 'Knowledge gives discipline; from discipline comes worthiness.',
} as const;

/** Only addresses on this domain may sign in. */
export const ALLOWED_EMAIL_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN ?? 'iiitl.ac.in';

export const SITE_URL = process.env.SITE_URL ?? 'http://localhost:3000';

/**
 * Where privacy and correction requests go. Set SUPPORT_EMAIL to a cell mailbox;
 * the pages simply omit the address while it is unset rather than inventing one.
 */
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || null;

/**
 * The first account created on an empty portal becomes the placement cell; after
 * that an admin promotes colleagues from Settings. No address is ever committed.
 */
