import Link from 'next/link';
import Image from 'next/image';
import { INSTITUTE } from '@/lib/site';
import { ThemeToggle } from '@/components/site/ThemeToggle';

/** Privacy and terms stay reachable without signing in. Nothing else is public. */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="border-b">
        <div className="mx-auto flex h-[64px] w-full max-w-[1200px] items-center gap-3 px-5 md:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/brand/iiitl-logo.png"
              alt=""
              width={40}
              height={36}
              className="h-9 w-auto"
            />
            <span className="leading-tight">
              <span className="display-caps block text-[13px]">{INSTITUTE.initials}</span>
              <span className="block text-[11px] text-muted">Training &amp; Placement</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="text-sm text-blue hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </header>
      <main id="main">{children}</main>
      <footer className="mt-20 border-t py-8">
        <p className="mx-auto w-full max-w-[1200px] px-5 text-xs text-faint md:px-8">
          &copy; {new Date().getFullYear()} {INSTITUTE.name}
        </p>
      </footer>
    </>
  );
}
