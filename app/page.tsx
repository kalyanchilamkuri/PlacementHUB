import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Briefcase, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';
import { getSession } from '@/lib/dal';
import { db } from '@/lib/db';
import { INSTITUTE } from '@/lib/site';
import { lpa } from '@/lib/utils';
import { CountUp } from '@/components/ui/CountUp';
import { ThemeToggle } from '@/components/site/ThemeToggle';

export const dynamic = 'force-dynamic';

export default async function RootPage() {
  const session = await getSession();
  if (session?.user) redirect(session.user.role === 'ADMIN' ? '/admin' : '/dashboard');

  const [students, offers, companies] = await Promise.all([
    db.student.count(),
    db.offer.findMany({ select: { studentId: true, ctc: true, offerType: true } }),
    db.offer.findMany({ distinct: ['driveId'], select: { drive: { select: { companyId: true } } } }),
  ]);
  const placed = new Set(offers.map((o) => o.studentId)).size;
  const highest = offers
    .filter((o) => ['FULL_TIME', 'PPO'].includes(o.offerType))
    .reduce((m, o) => Math.max(m, o.ctc), 0);
  const recruiters = new Set(companies.map((c) => c.drive.companyId)).size;

  const stats = [
    { label: 'Students placed', node: <CountUp to={placed} /> },
    {
      label: 'Placement rate',
      node: <CountUp to={students ? Math.round((placed / students) * 100) : 0} suffix="%" />,
    },
    { label: 'Highest package', node: highest ? <>{lpa(highest)}</> : <>—</> },
    { label: 'Recruiters', node: <CountUp to={recruiters} /> },
  ];

  const cards = [
    {
      href: '/login',
      icon: GraduationCap,
      title: 'Student',
      body: 'Track drives, applications, results and your placement journey.',
      colors: { c1: '#3b82f6', c2: '#06b6d4', c3: '#8b5cf6' },
      iconBg: 'bg-blue-wash text-blue',
    },
    {
      href: '/login',
      icon: ShieldCheck,
      title: 'Placement Cell',
      body: 'Record offers, manage drives, analytics and student data.',
      colors: { c1: '#f59e0b', c2: '#ef4444', c3: '#f97316' },
      iconBg: 'bg-arch-wash text-arch',
    },
    {
      href: '/login',
      icon: Briefcase,
      title: 'Recruiter',
      body: 'Post openings, schedule rounds and track hiring progress.',
      colors: { c1: '#10b981', c2: '#14b8a6', c3: '#22d3ee' },
      iconBg: 'bg-trace-wash text-trace',
    },
  ];

  return (
    <main className="relative min-h-dvh overflow-hidden bg-bg">
      {/* Clean background: soft radial glow + dot mesh */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,color-mix(in_oklab,var(--blue)_12%,transparent),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_60%,color-mix(in_oklab,var(--arch)_8%,transparent),transparent_60%)]" />
        <div className="hero-mesh absolute inset-0 opacity-60" />
      </div>

      <header className="relative mx-auto flex max-w-[1100px] items-center gap-3 px-5 py-5 md:px-8">
        <Image src="/brand/iiitl-logo.png" alt="" width={44} height={40} className="h-10 w-auto" />
        <span className="leading-tight">
          <span className="display-caps block text-sm">{INSTITUTE.initials}</span>
          <span className="block text-xs text-muted">Training &amp; Placement Cell</span>
        </span>
        <span className="ml-auto">
          <ThemeToggle />
        </span>
      </header>

      <section className="relative mx-auto max-w-[1100px] px-5 pb-20 pt-10 text-center md:px-8 md:pt-16">
        <p className="arrive mx-auto inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-4 py-1.5 text-sm text-muted backdrop-blur">
          <Sparkles size={14} className="text-arch" /> Ask the AI assistant about any placement
        </p>
        <h1
          className="arrive display mx-auto mt-6 max-w-[16ch] text-[clamp(2.6rem,7vw,5rem)]"
          style={{ animationDelay: '80ms' }}
        >
          Every offer, <span className="text-gradient">one place.</span>
        </h1>
        <p
          className="arrive mx-auto mt-5 max-w-[52ch] text-lg text-muted"
          style={{ animationDelay: '160ms' }}
        >
          See which companies came, who got picked, and where you stand, from your first internship
          to your final offer.
        </p>

        {/* --- 3 login cards with rotating borders --- */}
        <div className="mx-auto mt-12 grid max-w-[900px] gap-5 sm:grid-cols-3">
          {cards.map((c, i) => (
            <div
              key={c.title}
              className="arrive"
              style={{ animationDelay: `${240 + i * 100}ms` }}
            >
              <Link
                href={c.href}
                className="glow-card slow-grow group flex flex-col items-center px-5 py-8 text-center"
                style={{
                  '--rb-c1': c.colors.c1,
                  '--rb-c2': c.colors.c2,
                } as React.CSSProperties}
              >
                <span className={`niche grid size-16 shrink-0 place-items-center ${c.iconBg} mb-4`}>
                  <c.icon size={30} />
                </span>
                <span className="display text-xl">{c.title}</span>
                <span className="mt-2 text-sm leading-relaxed text-muted">{c.body}</span>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue transition-all duration-500 group-hover:gap-2.5">
                  Sign in <ArrowRight size={16} />
                </span>
              </Link>
            </div>
          ))}
        </div>

        <p className="arrive mt-6 text-sm text-muted" style={{ animationDelay: '560ms' }}>
          New here?{' '}
          <Link href="/register" className="text-blue hover:underline">
            Create your student account
          </Link>
        </p>

        {/* --- Live stats --- */}
        <dl className="arrive mx-auto mt-16 grid max-w-[860px] grid-cols-2 gap-3 md:grid-cols-4" style={{ animationDelay: '640ms' }}>
          {stats.map((s) => (
            <div key={s.label} className="shine rounded-2xl border border-line bg-surface/70 px-4 py-5 backdrop-blur">
              <dd className="tnum display text-[clamp(1.7rem,3.6vw,2.4rem)]">{s.node}</dd>
              <dt className="mt-1 text-sm text-muted">{s.label}</dt>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
