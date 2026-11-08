import Link from 'next/link';
import { Lock, Wallet } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { loadDB, ownerBalance } from '@/lib/store';
import { fmt } from '@/lib/money';
import { WithdrawForm } from '@/components/DashboardWidgets';

export const dynamic = 'force-dynamic';

export default async function WithdrawalsPage() {
  const user = await requireUser();
  const db = loadDB();
  const profile = db.profiles.find((p) => p.userId === user.id);
  const balance = ownerBalance(db, user.id);
  const withdrawals = db.withdrawals
    .filter((w) => w.ownerId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const verified = profile?.verification.status === 'verified';

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <h2 className="text-lg font-extrabold text-stone-900">Withdrawals</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {[
            { label: 'Available', value: balance.availableKobo },
            { label: 'Pending clearance', value: balance.pendingKobo },
            { label: 'Withdrawn', value: balance.withdrawnKobo },
          ].map((c) => (
            <div key={c.label} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-stone-200/70">
              <Wallet size={16} className="text-violet-600" />
              <p className="mt-1.5 text-lg font-extrabold text-stone-900">{fmt(c.value)}</p>
              <p className="text-[11px] font-medium text-stone-500">{c.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200/70">
          {!verified ? (
            <div className="text-center">
              <Lock className="mx-auto text-stone-300" size={38} />
              <p className="mt-2 font-bold text-stone-800">Verification required</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-stone-500">
                Withdrawals unlock after student verification. Your current status is{' '}
                <strong>{profile?.verification.status.replace('_', ' ')}</strong>.
              </p>
              <Link href="/dashboard/verification" className="mt-4 inline-block rounded-full bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-700">
                Go to verification
              </Link>
              <p className="mt-3 text-xs text-stone-400">Prototype note: review is simulated, so approval never lands in this build — the gate itself is fully functional.</p>
            </div>
          ) : (
            <WithdrawForm availableKobo={balance.availableKobo} bankLine={`${profile?.bankName} · ${profile?.accountNumber}`} />
          )}
        </div>
      </div>

      <div>
        <h3 className="font-bold text-stone-900">Withdrawal history</h3>
        {withdrawals.length === 0 ? (
          <p className="mt-3 rounded-3xl border-2 border-dashed border-stone-300 bg-white/50 p-8 text-center text-sm text-stone-400">No withdrawals yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-stone-100 rounded-3xl bg-white shadow-sm ring-1 ring-stone-200/70">
            {withdrawals.map((w) => (
              <li key={w.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-bold text-stone-800">{fmt(w.amountKobo)}</p>
                  <p className="text-xs text-stone-400">{new Date(w.createdAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold capitalize text-amber-700">{w.status}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs leading-relaxed text-stone-400">“Pending clearance” in this prototype: one seeded earning is held as a demo; new earnings are available immediately. Production would add payout holds and a minimum threshold (PRD open decisions).</p>
      </div>
    </div>
  );
}
