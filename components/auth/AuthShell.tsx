import Image from 'next/image';
import Link from 'next/link';
import { INSTITUTE } from '@/lib/site';
import { ArchOutline } from '@/components/brand/Arch';
import { ThemeToggle } from '@/components/site/ThemeToggle';

/** The frame shared by sign-in, first-run setup and registration. */
export function AuthShell({
  title,
  lead,
  children,
  footer,
}: {
  title: string;
  lead: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main id="main" className="substrate relative grid min-h-dvh place-items-center px-5 py-12">
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>

      <ArchOutline className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[420px] -translate-x-1/2 -translate-y-1/2 text-trace opacity-[.07]" />

      <div className="glass relative w-full max-w-[440px] rounded-3xl p-8 md:p-10">
        <Image
          src="/brand/iiitl-logo.png"
          alt=""
          width={64}
          height={58}
          className="h-14 w-auto"
          priority
        />

        <h1 className="display mt-6 text-[clamp(1.6rem,4vw,2.1rem)]">{title}</h1>
        <p className="display-caps mt-2 text-[11px] text-blue">{INSTITUTE.name}</p>
        <p className="mt-5 text-sm leading-relaxed text-muted">{lead}</p>

        {children}

        <div className="mt-8 border-t pt-5 text-xs text-faint">
          {footer}
          <p className={footer ? 'mt-3' : undefined}>
            {/* Spaces are explicit: margins are invisible to a screen reader,
                which would otherwise read "Privacyandterms". */}
            <Link href="/privacy" className="hover:text-blue">
              Privacy
            </Link>{' '}
            and{' '}
            <Link href="/terms" className="hover:text-blue">
              terms of use
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
