import Link from 'next/link';
import { ArchOutline } from '@/components/brand/Arch';

export default function NotFound() {
  return (
    <main
      id="main"
      className="substrate grid min-h-dvh place-items-center px-5 py-20 text-center"
    >
      <div>
        <ArchOutline className="mx-auto h-28 w-24 text-trace opacity-40" />
        <h1 className="display mt-8 text-[clamp(2rem,6vw,3rem)]">This page is not here</h1>
        <p className="mx-auto mt-3 max-w-[42ch] text-muted">
          The link may be from an old season, or a drive that has since closed.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center rounded-[10px] bg-blue px-5 text-sm font-medium text-on-blue"
          >
            Go to the home page
          </Link>
          <Link
            href="/drives"
            className="inline-flex h-11 items-center rounded-[10px] border border-line px-5 text-sm font-medium"
          >
            See open drives
          </Link>
        </div>
      </div>
    </main>
  );
}
