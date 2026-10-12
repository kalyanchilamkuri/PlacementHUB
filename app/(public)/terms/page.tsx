import type { Metadata } from 'next';
import { SUPPORT_EMAIL } from '@/lib/site';
import { Section } from '@/components/ui/kit';

export const metadata: Metadata = {
  title: 'Terms of use',
  description: 'The rules for using the IIIT Lucknow placement portal.',
};

export default function TermsPage() {
  return (
    <Section className="max-w-[72ch] pb-6 pt-10 md:pt-16">
      <h1 className="display text-[clamp(2rem,5vw,3rem)]">Terms of use</h1>
      <p className="mt-4 text-muted">
        Using this portal means agreeing to the following. The Training &amp; Placement Cell
        maintains these rules and can change them between seasons.
      </p>

      <h2 className="display mt-12 text-2xl">Who may use it</h2>
      <p className="mt-3 leading-relaxed text-muted">
        Students sign in with their institute Google account. Recruiter accounts are created by
        invitation. Accounts are personal; do not share your login.
      </p>

      <h2 className="display mt-10 text-2xl">Your record must be true</h2>
      <p className="mt-3 leading-relaxed text-muted">
        Academic fields are verified against the academic section. Anything you add yourself —
        projects, skills, links, resumes — must be accurate. Misrepresentation can mean withdrawal
        from the placement process.
      </p>

      <h2 className="display mt-10 text-2xl">The placement policy</h2>
      <ul className="mt-3 space-y-2 leading-relaxed text-muted">
        <li>Applying to a drive is a commitment to attend every round you are called to.</li>
        <li>
          Registering for a test and then not appearing affects your eligibility for the next
          drive.
        </li>
        <li>
          Once you hold an offer, you may apply only to drives above the threshold the cell has
          set.
        </li>
        <li>Withdrawing is allowed at any point before the deadline, without penalty.</li>
      </ul>

      <h2 className="display mt-10 text-2xl">What you post</h2>
      <p className="mt-3 leading-relaxed text-muted">
        Questions and interview experiences are reviewed by a coordinator before they appear. Do not
        post anything covered by an agreement you signed with a company, and do not name individual
        interviewers.
      </p>

      <h2 className="display mt-10 text-2xl">What the cell does not guarantee</h2>
      <p className="mt-3 leading-relaxed text-muted">
        The cell arranges the process; it does not guarantee an offer. Package figures shown are as
        reported by recruiters and may include components that vary.
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
          'Ask the Training & Placement Cell.'
        )}
      </p>
    </Section>
  );
}
