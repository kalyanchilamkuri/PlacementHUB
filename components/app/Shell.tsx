'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Bell,
  Building2,
  CalendarDays,
  FileText,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Megaphone,
  Menu,
  PenLine,
  Settings,
  Users,
  UserRound,
  Briefcase,
  Award,
  BarChart3,
  GraduationCap,
  Trophy,
  X,
  type LucideIcon,
} from 'lucide-react';
import { INSTITUTE } from '@/lib/site';
import { cn, initials } from '@/lib/utils';
import { ThemeToggle } from '@/components/site/ThemeToggle';
import { ChatWidget } from '@/components/app/ChatWidget';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: string;
};

type NavSection = { heading?: string; items: NavItem[] };

const STUDENT_NAV: NavSection[] = [
  {
    items: [
      { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
      { href: '/placements', label: 'Placements', icon: Trophy },
      { href: '/drives', label: 'Open drives', icon: Briefcase },
      { href: '/applications', label: 'My applications', icon: ListChecks },
      { href: '/calendar', label: 'Calendar', icon: CalendarDays },
      { href: '/notices', label: 'Notices', icon: Megaphone },
      { href: '/profile', label: 'My profile', icon: UserRound },
    ],
  },
];

const ADMIN_NAV: NavSection[] = [
  {
    items: [
      { href: '/admin', label: 'Overview', icon: LayoutDashboard },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    heading: 'People & Placements',
    items: [
      { href: '/admin/students', label: 'Students', icon: Users },
      { href: '/admin/placements', label: 'Placements', icon: GraduationCap },
    ],
  },
  {
    heading: 'Recruitment',
    items: [
      { href: '/admin/companies', label: 'Companies', icon: Building2 },
      { href: '/admin/drives', label: 'Drives', icon: Briefcase, match: '/admin/drives' },
    ],
  },
  {
    heading: 'Actions',
    items: [
      { href: '/admin/offers', label: 'New offer', icon: Award },
      { href: '/admin/drives/new', label: 'New drive', icon: Briefcase, match: '/admin/drives/new' },
      { href: '/admin/notices', label: 'New notice', icon: PenLine },
    ],
  },
  {
    items: [
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const SECTIONS: Record<'student' | 'admin', NavSection[]> = {
  student: STUDENT_NAV,
  admin: ADMIN_NAV,
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
  const sections = SECTIONS[variant];
  const allItems = sections.flatMap((s) => s.items);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (item: NavItem) => {
    if (item.href === '/admin') return pathname === '/admin';
    const match = item.match ?? item.href;
    if (match === '/admin/drives/new') return pathname === '/admin/drives/new';
    if (match === '/admin/drives') return pathname.startsWith('/admin/drives') && pathname !== '/admin/drives/new';
    return pathname.startsWith(match);
  };

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

        <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-2">
          {sections.map((section, si) => {
            const hasActive = section.items.some(isActive);
            return (
              <div
                key={si}
                className={cn(
                  'rounded-xl border p-1.5 transition-colors',
                  hasActive
                    ? 'border-blue/25 bg-blue-wash/40'
                    : 'border-line/60 bg-surface-2/40',
                )}
              >
                {section.heading && (
                  <p className="px-2.5 pb-0.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-faint">
                    {section.heading}
                  </p>
                )}
                {section.items.map((item) => {
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors',
                        active
                          ? 'bg-surface font-medium text-ink shadow-[var(--shadow-lift)]'
                          : 'text-muted hover:bg-surface/50 hover:text-ink',
                      )}
                    >
                      {active && (
                        <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-trace" aria-hidden />
                      )}
                      <item.icon size={17} className={active ? 'text-blue' : ''} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
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
                {allItems.map((item) => (
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
        <ChatWidget role={variant === 'admin' ? 'ADMIN' : 'STUDENT'} storageKey={user.email ?? 'anon'} />
      </div>
    </div>
  );
}
