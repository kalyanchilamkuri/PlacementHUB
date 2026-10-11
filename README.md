# IIIT Lucknow — Training & Placement Portal

A closed portal. The placement cell signs in and enters everything; students sign
in, see the drives they qualify for, apply, and watch their application move
through the rounds.

There is no seed data and nothing is copied from any other site. A fresh install
is empty until the cell fills it in.

## Running it

```bash
npm install
cp .env.example .env.local     # set AUTH_SECRET
npx prisma migrate dev
npm run dev                    # http://localhost:3000
```

### First run

Open `/login`. Because the database is empty, it offers to **set up the portal**:
the first account created becomes the placement cell and can manage everything.
After that `/login` is an ordinary sign-in screen, and students register
themselves at `/register`. Promote colleagues to admin from **Settings**, so no
address is ever committed to the repo.

| Variable | What it does |
| --- | --- |
| `DATABASE_URL` | SQLite file. In `.env` so the Prisma CLI sees it too. |
| `AUTH_SECRET` | Signs the session cookie. `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `ALLOWED_EMAIL_DOMAIN` | Only this domain may register or sign in. Defaults to `iiitl.ac.in`. |
| `SUPPORT_EMAIL` | Optional. Shown on the privacy and terms pages when set. |
| `SITE_URL` | Optional. Absolute URLs in metadata. |

### Passwords

Email and password, hashed with `scrypt` from Node's standard library — no
bcrypt, so there is no native module to build. The format is
`scrypt:<salt>:<key>`, so the scheme is visible in the column if it ever needs
migrating. `lib/password.ts` is server-only; the shared rule the forms display
lives in `lib/password-rules.ts` so importing it does not drag hashing into the
client bundle.

There is **no email service**, which has one real consequence: a forgotten
password cannot be self-served. The cell resets it from **Settings → Reset
password**, which sets a temporary password and flags the account so the student
is asked to choose their own from their profile. The other consequence is that
addresses are unverified — anyone who knows a colleague's address could register
it first. Adding an email one-time code at registration is the fix, and is the
main thing standing between this and production.

## How authorization works

Read this before adding a page.

`proxy.ts` (Next 16 renamed middleware to **proxy**) only does an optimistic
cookie check so signed-out visitors get bounced to `/login`. It is **not** the
guard — the installed docs at
`node_modules/next/dist/docs/01-app/02-guides/authentication.md` say plainly that
proxy is not an authorization solution, and that a check in a layout is not one
either, because layouts do not re-render on navigation and do not control whether
their child segments render.

So the real check is `lib/dal.ts`, and **every page and every server action calls
it itself**:

- `verifySession()` — signed in, or redirect to `/login`
- `requireAdmin()` — admin, or redirect to `/dashboard`
- `requireStudent()` — student, and returns their `Student` row

The layouts call these too, but only to fetch the name and avatar for the
chrome. A page that forgets to call one is an open page.

## The model

SQLite has no Prisma enums, so status columns are strings; the permitted values
live in `lib/types.ts` and are enforced in TypeScript.

```
Company ─< Drive ─< Round
               │
               └─< Application >─ Student ─ User
                        │
                        └─< RoundResult
```

`Application.stage` is never set by hand. `lib/stage.ts` derives it from the
round results on every write: any FAIL → not selected, every round passed → offer,
otherwise in progress. Clearing every round also records an `Offer`, so the
overview figures follow from the same toggles rather than a second step
someone forgets.

`lib/eligibility.ts` is the single source for who can apply. The drive card
badge, the apply button, the per-rule checklist and the calendar filter all call
`checkEligibility()`, so they cannot disagree. It returns reasons a student can
act on: `"Needs 8.5 CGPA — yours is 8.42"`.

## Notices and notifications

Two separate things. **Notices** are written by the cell and persist on a board
(`/notices`, `/admin/notices`). **Notifications** are per-student and emitted
by events — nobody writes them. Publishing a notice emits notifications.

Every emit rule lives in `lib/notify.ts` so "who is told what" has one answer,
and the fan-out calls the same `checkEligibility()` the drive list uses — a
notification can therefore never claim a student qualifies for something the
drive list says they don't.

| Event | Who hears |
| --- | --- |
| Drive published | every student who passes eligibility |
| Round result recorded | that one student |
| Deadline inside 24h, not yet applied | eligible students |
| Notice published | the branches it targets |

Repeats are prevented by `dedupeKey` with `@@unique([userId, dedupeKey])`.
Prisma has no `skipDuplicates` on SQLite, so `emit()` filters against existing
keys first and treats a `P2002` from a lost race as success — the row exists
either way, which is the wanted state.

**Two honest limitations.** There is no job runner, so deadline reminders are
computed lazily when a student opens their dashboard or notifications page
(`syncDeadlineNotifications`); it is idempotent and cheap, but it only reaches
students who are already looking. And the bell count comes from the layout,
which does not re-render on client navigation — marking read calls
`revalidatePath('/', 'layout')` to refresh it, but notifications arriving while
you browse appear on the next full load, not live. Both are fixed properly by
email plus a scheduler.

## The screens

**Placement cell** — `/admin` (first-run checklist, then season figures),
`/admin/notices`, `/admin/companies`, `/admin/drives` and `/admin/drives/new` (with a live
eligible-student counter), `/admin/drives/[id]/applicants`, `/admin/students`,
`/admin/settings` (branches and who else is an admin).

The applicants table is the centre of it: one row per student, one column per
round, each cell a toggle cycling pending → passed → not passed. Select rows to
mark a whole shortlist at once.

**Students** — `/dashboard`, `/drives`, `/drives/[id]`, `/applications` (what is
still open to you, then your tracker), `/calendar` (click an entry to open the
drive and apply), `/notices`, `/notifications`, `/profile`.

`/privacy` and `/terms` are the only pages reachable without signing in.

## Design language

The institute crest is a cusped Awadhi arch with printed-circuit traces
radiating out of it. Both motifs carry the design, and the palette is sampled
from the crest file rather than invented: `#005F99` blue, `#008325` trace green,
`#DE6C1A` arch orange.

Marcellus (inscriptional, display only, never below 28px) over Archivo for
everything functional. `.glass` for floating layers, `.glass-nav` for navigation
— frosted harder, because links must stay legible over any content. The `.niche`
class puts company marks in an arched recess instead of another rounded
rectangle. One orchestrated arrival per page, all of it behind
`prefers-reduced-motion`.

Chart colours are stepped per mode and validated for colour-vision separation
and contrast against each mode's surface.

## Known constraints

- **Node.** Prisma is pinned to 6.19.3 because 7.x requires Node 20.19+/22.12+/24+
  and this machine runs 23.3.0, which is an end-of-life line. After upgrading to
  Node 24, `npm i prisma@7 @prisma/client@7` is worth doing. Note that `prisma`'s
  `latest` tag currently points at an 8.0 release candidate while
  `@prisma/client`'s points at 7.10 — pin both to the same version.
- **SQLite** does not survive Vercel's serverless filesystem. For a deploy,
  switch the datasource to Postgres; nothing else has to change.
- `npm audit` reports a stack-exhaustion advisory in `deepmerge-ts`, pulled in by
  the Prisma **CLI** (`@prisma/config`), not the runtime client. It clears when
  Prisma moves to 7.

## Not built yet

Resume file upload (the profile takes a link for now), email notifications, the
question bank and interview experiences, the recruiter portal, reports and
exports, and the audit log.
