'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useClientDB } from '@/lib/hooks';
import { getSessionUserId } from '@/lib/localstore';
import { LogoutButton } from '@/components/DashboardWidgets';
import { LoadingBlock } from '@/components/ui';

const TABS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/gifts', label: 'Gifts' },
  { href: '/dashboard/verification', label: 'Verification' },
  { href: '/dashboard/withdrawals', label: 'Withdrawals' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, db } = useClientDB();
  const userId = ready ? getSessionUserId() : null;
  const user = ready && db && userId ? db.users.find((u) => u.id === userId) : undefined;
  const profile = ready && db && userId ? db.profiles.find((p) => p.userId === userId) : undefined;
  const blocked = ready && (!userId || !profile?.commissionAcceptedAt);

  // Client-side route guards (the session lives in localStorage).
  useEffect(() => {
    if (!ready) return;
    if (!userId) router.replace('/login');
    else if (!profile?.commissionAcceptedAt) router.replace('/onboarding');
  }, [ready, userId, profile, router]);

  if (!ready || blocked || !user || !profile) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-16"><LoadingBlock /></div>
    );
  }
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-3 pt-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">{user.name}</h1>
          <p className="text-sm text-stone-500">{profile.department} · {profile.school}</p>
        </div>
        <LogoutButton />
      </div>
      <nav className="mt-5 flex gap-1 overflow-x-auto border-b border-stone-200">
        {TABS.map((t) => {
          const active = t.href === '/dashboard' ? pathname === '/dashboard' || pathname.startsWith('/dashboard/shirts') : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition ${active ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-900'}`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      <div className="pt-6">{children}</div>
    </div>
  );
}
