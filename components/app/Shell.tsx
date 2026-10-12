'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Bell,
  Building2,
  CalendarDays,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  Users,
  UserRound,
  Briefcase,
  X,
  type LucideIcon,
} from 'lucide-react';
import { INSTITUTE } from '@/lib/site';
import { cn, initials } from '@/lib/utils';
import { ThemeToggle } from '@/components/site/ThemeToggle';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Prefix used to decide the active state, when it differs from href. */
  match?: string;
};

/** Defined here rather than passed in: a server component cannot send a
 *  component reference like an icon across the client boundary. */
const NAV: Record<'student' | 'admin', NavItem[]> = {
  student: [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/drives', label: 'Drives', icon: Briefcase },
    { href: '/applications', label: 'Applications', icon: ListChecks },
    { href: '/calendar', label: 'Calendar', icon: CalendarDays },
    { href: '/notices', label: 'Notices', icon: Megaphone },
    { href: '/profile', label: 'Profile', icon: UserRound },
  ],
  admin: [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/companies', label: 'Companies', icon: Building2 },
    { href: '/admin/drives', label: 'Drives', icon: Briefcase },
    { href: '/admin/students', label: 'Students', icon: Users },
    { href: '/admin/notices', label: 'Notices', icon: Megaphone },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ],
};

export function Shell({
  variant,
  user,
  kicker,
  unread = 0,
  signOut,
  children,
}: {
  variant: 'student' | 'admin';
  user: { name: string | null; email: string | null; image: string | null; subtitle: string };
  kicker: string;
  /** Unread notifications. Set from the layout, so it refreshes on a full load
   *  or when marking read revalidates the layout — not live. */
  unread?: number;
  signOut: () => Promise<void>;
  children: React.ReactNode;
}) {
  const nav = NAV[variant];
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // /admin is the overview, so it must not light up for every /admin/* child.
  const isActive = (item: NavItem) =>
    item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.match ?? item.href);

  const avatar = (
    <span className="niche grid size-9 shrink-0 place-items-center overflow-hidden border border-line bg-blue-wash text-xs font-medium text-blue">
      {user.image ? (
        <Image src={user.image} alt="" width={36} height={36} className="size-full object-cover" />
      ) : (
        initials(user.name ?? user.email ?? '?')
      )}
    </span>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r bg-bg-sunk lg:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <Image src="/brand/iiitl-logo.png" alt="" width={40} height={36} className="h-9 w-auto" />
          <span className="leading-tight">
            <span className="display-caps block text-[13px]">{INSTITUTE.initials}</span>
            <span className="block text-[11px] text-muted">{kicker}</span>
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {nav.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm transition-colors',
                  active
                    ? 'bg-surface font-medium text-ink shadow-[var(--shadow-lift)]'
                    : 'text-muted hover:bg-surface/60 hover:text-ink',
                )}
              >
                {active && (
                  <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-trace" aria-hidden />
                )}
                <item.icon size={18} className={active ? 'text-blue' : ''} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            {avatar}
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-medium">{user.name ?? 'Signed in'}</span>
              <span className="block truncate text-xs text-muted">{user.subtitle}</span>
            </span>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-ink"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col pb-20 lg:pb-0">
        <header className="glass-nav sticky top-0 z-40 border-b">
          <div className="flex h-[60px] items-center gap-3 px-5 md:px-8">
            <Image
              src="/brand/iiitl-logo.png"
              alt=""
              width={32}
              height={29}
              className="h-7 w-auto lg:hidden"
            />
            <p className="hidden text-sm text-muted sm:block">{user.subtitle}</p>
            <div className="ml-auto flex items-center gap-2">
              {variant === 'student' && (
                <Link
                  href="/notifications"
                  aria-label={
                    unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'
                  }
                  className="relative grid size-9 place-items-center rounded-[10px] border border-line text-muted transition-colors hover:border-blue hover:text-blue"
                >
                  <Bell size={18} />
                  {unread > 0 && (
                    <span className="tnum absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-blue px-1 text-[10px] font-semibold text-on-blue ring-2 ring-bg">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Link>
              )}
              <ThemeToggle />
              <span className="lg:hidden">{avatar}</span>
              <button
                onClick={() => setOpen((v) => !v)}
                className="grid size-9 place-items-center rounded-[10px] border border-line text-muted lg:hidden"
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
              >
                {open ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>

          {open && (
            <div className="border-t lg:hidden">
              <nav className="grid gap-1 px-4 py-3" onClick={() => setOpen(false)}>
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm hover:bg-surface-2"
                  >
                    <item.icon size={18} />
                    {item.label}
                  </Link>
                ))}
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm text-muted"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </form>
              </nav>
            </div>
          )}
        </header>

        <main id="main" className="min-w-0 flex-1 px-5 py-7 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
