import type { Metadata } from 'next';
import { requireStudent } from '@/lib/dal';
import { db } from '@/lib/db';
import { ChangePassword } from './ChangePassword';
import { ProfileForm } from './ProfileForm';

export const metadata: Metadata = { title: 'Profile' };

export default async function ProfilePage() {
  const { student, name, email, userId } = await requireStudent();

  const [branches, account] = await Promise.all([
    db.branch.findMany({
      orderBy: [{ programme: 'asc' }, { code: 'asc' }],
      select: { code: true, name: true, programme: true },
    }),
    db.user.findUnique({ where: { id: userId }, select: { mustChangePassword: true } }),
  ]);

  return (
    <div className="mx-auto w-full max-w-[760px]">
      <h1 className="display text-[clamp(1.7rem,3.6vw,2.3rem)]">Your profile</h1>
      <p className="mt-2 text-muted">
        Drives read these fields to work out what you qualify for, so keep them accurate.
      </p>

      <ProfileForm
        name={name}
        email={email}
        branches={branches}
        student={{
          rollNo: student.rollNo,
          branchCode: student.branchCode,
          batch: student.batch,
          phone: student.phone,
          cgpa: student.cgpa,
          tenthPct: student.tenthPct,
          twelfthPct: student.twelfthPct,
          activeBacklogs: student.activeBacklogs,
          resumeUrl: student.resumeUrl,
          resumeLabel: student.resumeLabel,
          skills: student.skills,
          linkedinUrl: student.linkedinUrl,
          verified: student.verified,
        }}
      />

      <div className="mt-5">
        <ChangePassword mustChange={account?.mustChangePassword ?? false} />
      </div>
    </div>
  );
}
