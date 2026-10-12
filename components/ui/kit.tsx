import Link from 'next/link';
import { cn, initials } from '@/lib/utils';

/* ------------------------------------------------------------------ button */

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-[10px] font-medium transition-[transform,background-color,border-color,box-shadow] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-45';

const BUTTON_VARIANT = {
  primary: 'bg-blue text-on-blue hover:bg-blue-deep shadow-[0_1px_2px_rgb(0_0_0/.18)]',
  secondary: 'bg-surface-2 text-ink hover:bg-blue-wash border border-line',
  outline: 'border border-line bg-transparent text-ink hover:border-blue hover:text-blue',
  ghost: 'text-muted hover:bg-surface-2 hover:text-ink',
};

const BUTTON_SIZE = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export function Button({
  children,
  href,
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: ButtonProps) {
  const cls = cn(BUTTON_BASE, BUTTON_VARIANT[variant], BUTTON_SIZE[size], className);
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------- badge
   Every status carries a word as well as a colour. */

export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral' | 'accent';

const TONE: Record<Tone, string> = {
  ok: 'bg-trace-wash text-ok border-ok/25',
  warn: 'bg-arch-wash text-warn border-warn/25',
  bad: 'bg-[color-mix(in_oklab,var(--bad)_12%,transparent)] text-bad border-bad/25',
  info: 'bg-blue-wash text-blue border-blue/25',
  neutral: 'bg-surface-2 text-muted border-line',
  accent: 'bg-arch-wash text-arch border-arch/30',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------- logo tile */

export function CompanyMark({
  name,
  size = 'md',
  className,
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const box = { sm: 'size-9 text-[11px]', md: 'size-12 text-sm', lg: 'size-16 text-lg' }[size];
  return (
    <span
      className={cn(
        'niche grid shrink-0 place-items-center border border-line bg-surface-2 font-display tracking-wide text-blue',
        box,
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

/* ----------------------------------------------------------------- layout */

export function Section({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn('mx-auto w-full max-w-[1200px] px-5 md:px-8', className)}>
      {children}
    </section>
  );
}

export function SectionHead({
  title,
  lead,
  action,
}: {
  title: string;
  lead?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-[54ch]">
        <h2 className="display text-[clamp(1.6rem,3.2vw,2.3rem)]">{title}</h2>
        {lead && <p className="mt-2 text-muted">{lead}</p>}
      </div>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------- stat tile */

export function StatTile({
  value,
  label,
  note,
  tone = 'default',
}: {
  value: React.ReactNode;
  label: string;
  note?: string;
  tone?: 'default' | 'accent';
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-surface p-5',
        tone === 'accent' ? 'border-arch/35' : 'border-line',
      )}
    >
      {tone === 'accent' && (
        <span
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,var(--arch),transparent)' }}
          aria-hidden
        />
      )}
      <div
        className={cn(
          'tnum display text-[clamp(1.9rem,4.4vw,2.7rem)]',
          tone === 'accent' ? 'text-arch' : 'text-ink',
        )}
      >
        {value}
      </div>
      <div className="mt-1 text-sm font-medium">{label}</div>
      {note && <div className="mt-1 text-xs text-muted">{note}</div>}
    </div>
  );
}

/* ----------------------------------------------------------- empty state
   The portal ships with nothing in it, so these are load-bearing: each one
   says what is missing and offers the single action that fixes it. */

export function EmptyState({
  title,
  body,
  action,
  icon,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
      {icon && (
        <span className="niche mx-auto mb-4 grid size-12 place-items-center border border-line bg-surface-2 text-muted">
          {icon}
        </span>
      )}
      <p className="font-medium">{title}</p>
      <p className="mx-auto mt-1.5 max-w-[46ch] text-sm leading-relaxed text-muted">{body}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

/** Inline error for a failed server action. */
export function FormError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="rounded-xl border border-bad/30 bg-[color-mix(in_oklab,var(--bad)_8%,transparent)] px-4 py-2.5 text-sm text-bad"
    >
      {children}
    </p>
  );
}
