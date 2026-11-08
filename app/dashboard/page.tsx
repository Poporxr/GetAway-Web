import Link from 'next/link';
import { Gift, Inbox, PiggyBank, Shirt as ShirtIcon, TrendingDown, Wallet } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { loadDB, ownerBalance } from '@/lib/store';
import { fmt } from '@/lib/money';
import ShirtViewer from '@/components/ShirtViewer';
import { CopyButton } from '@/components/ui';
import { CreateShirtButton } from '@/components/DashboardWidgets';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await requireUser();
  const db = loadDB();
  const balance = ownerBalance(db, user.id);
  const shirts = db.shirts.filter((s) => s.ownerId === user.id);
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://signout.ng';

  const stats = [
    { icon: Gift, label: 'Gifts received', value: String(balance.giftCount) },
    { icon: Wallet, label: 'Gross gifted', value: fmt(balance.grossKobo) },
    { icon: TrendingDown, label: 'Platform fees (10%)', value: fmt(balance.feesKobo) },
    { icon: PiggyBank, label: 'Available balance', value: fmt(balance.availableKobo) },
    { icon: Inbox, label: 'Pending clearance', value: fmt(balance.pendingKobo) },
    { icon: ShirtIcon, label: 'Signatures collected', value: String(balance.signatureCount) },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-stone-200/70">
            <s.icon size={18} className="text-violet-600" />
            <p className="mt-2 text-xl font-extrabold text-stone-900">{s.value}</p>
            <p className="text-xs font-medium text-stone-500">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-extrabold text-stone-900">Your shirts</h2>
      {shirts.length === 0 && (
        <div className="mt-3 rounded-3xl border-2 border-dashed border-stone-300 bg-white/50 p-8 text-center">
          <ShirtIcon className="mx-auto text-stone-300" size={40} />
          <p className="mt-2 font-bold text-stone-700">No shirts yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-stone-500">Create your first signing-out shirt and share the link with your people.</p>
          <div className="mt-4 flex justify-center gap-3">
            <CreateShirtButton type="tee" label="Create the classic tee" />
            <CreateShirtButton type="longsleeve" label="Create the long-sleeve" />
          </div>
        </div>
      )}
      <div className="mt-3 grid gap-5 lg:grid-cols-2">
        {shirts.map((shirt) => {
          const sigs = db.signatures.filter((s) => s.shirtId === shirt.id);
          const gifts = db.payments.filter((p) => p.shirtId === shirt.id && p.status === 'success');
          const url = `${base}/s/${shirt.slug}`;
          return (
            <div key={shirt.id} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200/70">
              <div className="bg-gradient-to-b from-violet-50 to-amber-50">
                <ShirtViewer type={shirt.type} signatures={sigs} height={300} />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-stone-900">{shirt.type === 'tee' ? 'Classic Tee' : 'Long-Sleeve Shirt'}</h3>
                  <span className="text-xs font-semibold text-stone-400">{sigs.length} signatures · {gifts.length} gifts</span>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-2xl bg-stone-50 p-2 pl-3">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-600">{url}</span>
                  <CopyButton text={url} />
                </div>
                <div className="mt-3 flex gap-2">
                  <Link href={`/dashboard/shirts/${shirt.id}`} className="rounded-full bg-stone-900 px-4 py-2 text-sm font-bold text-white hover:bg-stone-700">Open shirt</Link>
                  <Link href={`/s/${shirt.slug}`} className="rounded-full bg-stone-100 px-4 py-2 text-sm font-bold text-stone-600 hover:bg-stone-200">Public page</Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {shirts.length > 0 && shirts.length < 2 && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-3xl bg-violet-50 p-5 ring-1 ring-violet-100">
          <p className="text-sm font-semibold text-violet-900">You can have one of each design — add your second shirt:</p>
          {!shirts.some((s) => s.type === 'tee') && <CreateShirtButton type="tee" label="Add the classic tee" />}
          {!shirts.some((s) => s.type === 'longsleeve') && <CreateShirtButton type="longsleeve" label="Add the long-sleeve" />}
        </div>
      )}
    </div>
  );
}
