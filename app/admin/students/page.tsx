import type { Metadata } from 'next';
import { Users } from 'lucide-react';
import { requireAdmin } from '@/lib/dal';
import { db } from '@/lib/db';
import { ALLOWED_EMAIL_DOMAIN } from '@/lib/site';
import { Badge, EmptyState } from '@/components/ui/kit';
import { VerifyToggle } from './VerifyToggle';

export const metadata: Metadata = { title: 'Students' };

export default async function AdminStudentsPage() {
  await requireAdmin();

  const students = await db.student.findMany({
    orderBy: [{ branchCode: 'asc' }, { rollNo: 'asc' }],
    include: {
      user: { select: { name: true, email: true } },
      branch: { select: { code: true } },
      _count: { select: { applications: true, offers: true } },
    },
  });

  const verified = students.filter((s) => s.verified).length;
  const incomplete = students.filter((s) => !s.cgpa || !s.branchCode).length;

  return (
    <div className="mx-auto w-full max-w-[1200px]">
      <h1 className="display text-[clamp(1.7rem,3.6vw,2.3rem)]">Students</h1>
      <p className="mt-2 text-muted">
        A record appears here the first time someone signs in with an @{ALLOWED_EMAIL_DOMAIN}{' '}
        address. Verifying locks their academics so they cannot change them.
      </p>

      {students.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={<Users size={20} />}
            title="No students yet"
            body={`Nobody has signed in. Share the portal link — anyone with an @${ALLOWED_EMAIL_DOMAIN} address can sign in and fill in their profile.`}
          />
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              { label: 'Registered', value: students.length },
              { label: 'Verified', value: verified },
              { label: 'Profile incomplete', value: incomplete },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-line bg-surface px-4 py-2.5">
                <span className="tnum block text-xl font-semibold">{c.value}</span>
                <span className="text-xs text-muted">{c.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-surface">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b bg-surface-2 text-left">
                  <th scope="col" className="px-4 py-3 font-semibold">Student</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Roll number</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Branch</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">CGPA</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Applications</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Academics</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <th scope="row" className="px-4 py-3 text-left font-medium">
                      {s.user.name ?? s.user.email}
                      <span className="mt-0.5 block truncate text-xs font-normal text-muted">
                        {s.user.email}
                      </span>
                    </th>
                    <td className="tnum px-4 py-3">{s.rollNo ?? '—'}</td>
                    <td className="px-4 py-3">
                      {s.branch?.code ? (
                        <Badge tone="info">{s.branch.code}</Badge>
                      ) : (
                        <span className="text-faint">Not set</span>
                      )}
                    </td>
                    <td className="tnum px-4 py-3 text-right">{s.cgpa?.toFixed(2) ?? '—'}</td>
                    <td className="tnum px-4 py-3 text-right">
                      {s._count.applications}
                      {s._count.offers > 0 && (
                        <span className="ml-2 text-xs text-ok">
                          {s._count.offers} offer{s._count.offers === 1 ? '' : 's'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <VerifyToggle studentId={s.id} verified={s.verified} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
