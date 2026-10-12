import type { Metadata } from 'next';
import { SUPPORT_EMAIL } from '@/lib/site';
import { Section } from '@/components/ui/kit';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What the placement portal stores, why, and who can see it.',
};

const WHO_SEES = [
  { data: 'CGPA, marks and backlogs', who: 'You and the T&P cell. Recruiters see them only for their own applicants, and only where the cell allows it.' },
  { data: 'Phone number and date of birth', who: 'You and the T&P cell.' },
  { data: 'Resumes and offer letters', who: 'Stored privately. Links expire ten minutes after they are issued.' },
  { data: 'Placement status', who: 'You and the T&P cell. In public it appears only inside totals.' },
  { data: 'Your name, photo, company and package', who: 'Public only if you opt in. You can withdraw that at any time.' },
  { data: 'Interview experiences', who: 'Signed-in students. If you post anonymously, your name is not shown or stored on the post.' },
];

export default function PrivacyPage() {
  return (
    <Section className="max-w-[72ch] pb-6 pt-10 md:pt-16">
      <h1 className="display text-[clamp(2rem,5vw,3rem)]">Privacy</h1>
      <p className="mt-4 text-muted">
        This portal holds marks, phone numbers and salaries for several hundred students. This page
        says plainly what is kept and who can see it.
      </p>

      <h2 className="display mt-12 text-2xl">What we collect</h2>
      <p className="mt-3 leading-relaxed text-muted">
        Your name, roll number, programme and batch come from the academic section. You add your
        contact details, resumes, skills, projects and links. Everything else — applications,
        stages, offers — is created as you use the portal.
      </p>

      <h2 className="display mt-10 text-2xl">Who can see what</h2>
      <dl className="mt-4 divide-y rounded-2xl border border-line bg-surface px-5">
        {WHO_SEES.map((r) => (
          <div key={r.data} className="py-4">
            <dt className="font-medium">{r.data}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted">{r.who}</dd>
          </div>
        ))}
      </dl>

      <h2 className="display mt-10 text-2xl">Your choices</h2>
      <ul className="mt-3 space-y-2 leading-relaxed text-muted">
        <li>You consent at onboarding, and separately for any public highlight.</li>
        <li>You can download everything the portal holds about you.</li>
        <li>You can ask for a correction where a verified field is wrong.</li>
        <li>You can mute non-urgent email. Schedule changes and offers always go out.</li>
      </ul>

      <h2 className="display mt-10 text-2xl">How long it is kept</h2>
      <p className="mt-3 leading-relaxed text-muted">
        Data for graduated batches is archived on a schedule the T&amp;P cell sets. Offers and the
        audit log are never deleted, because the institute reports on them.
      </p>

      <h2 className="display mt-10 text-2xl">The law</h2>
      <p className="mt-3 leading-relaxed text-muted">
        We collect only what the placement process needs, state why, and allow correction, in line
        with India&rsquo;s Digital Personal Data Protection Act, 2023.
      </p>

      <h2 className="display mt-10 text-2xl">Questions</h2>
      <p className="mt-3 leading-relaxed text-muted">
        {SUPPORT_EMAIL ? (
          <>
            Write to{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue hover:underline">
              {SUPPORT_EMAIL}
            </a>
            .
          </>
        ) : (
          'Ask the Training & Placement Cell, or raise a correction request from your profile once you are signed in.'
        )}
      </p>
    </Section>
  );
}
