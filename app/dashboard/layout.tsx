import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { loadDB } from '@/lib/store';
import { LogoutButton } from '@/components/DashboardWidgets';

export const dynamic = 'force-dynamic';

const TABS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/gifts', label: 'Gifts' },
  { href: '/dashboard/verification', label: 'Verification' },
  { href: '/dashboard/withdrawals', label: 'Withdrawals' },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const db = loadDB();
  const profile = db.profiles.find((p) => p.userId === user.id);
  if (!profile?.commissionAcceptedAt) redirect('/onboarding');
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-3 pt-8">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">{user.name}</h1>
          <p className="text-sm text-stone-500">{profile.department} · {profile.school}</p>
        </div>
        <LogoutButton />
      </div>
      <nav className="mt-5 flex gap-1 overflow-x-auto border-b border-stone-200">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className="whitespace-nowrap rounded-t-xl px-4 py-2.5 text-sm font-bold text-stone-600 hover:bg-white hover:text-violet-700">
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="pt-6">{children}</div>
    </div>
  );
}
