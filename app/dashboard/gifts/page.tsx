import { Gift } from 'lucide-react';
import { requireUser } from '@/lib/auth';
import { loadDB } from '@/lib/store';
import { fmt } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function GiftsPage() {
  const user = await requireUser();
  const db = loadDB();
  const myShirts = new Map(db.shirts.filter((s) => s.ownerId === user.id).map((s) => [s.id, s]));
  const payments = db.payments
    .filter((p) => myShirts.has(p.shirtId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <h2 className="text-lg font-extrabold text-stone-900">Gift history</h2>
      <p className="text-sm text-stone-500">Every gift attempt across your shirts. Your share is 90% of each successful total.</p>
      {payments.length === 0 ? (
        <div className="mt-5 rounded-3xl border-2 border-dashed border-stone-300 bg-white/50 p-10 text-center">
          <Gift className="mx-auto text-stone-300" size={36} />
          <p className="mt-2 font-bold text-stone-700">No gifts yet</p>
          <p className="text-sm text-stone-500">Share your shirt link and gifts will land here.</p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200/70">
          <ul className="divide-y divide-stone-100">
            {payments.map((p) => {
              const signed = db.signatures.some((s) => s.paymentId === p.id);
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 font-hand text-lg font-bold text-violet-700">
                    {p.contributorName.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-stone-800">{p.contributorName}</p>
                    <p className="text-xs text-stone-400">
                      {myShirts.get(p.shirtId)?.type === 'tee' ? 'Classic Tee' : 'Long-Sleeve'} · {p.size}× signature · {new Date(p.createdAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })} · ref {p.reference}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-stone-900">{fmt(p.giftKobo)}{p.surchargeKobo > 0 && <span className="font-semibold text-stone-400"> +{fmt(p.surchargeKobo)}</span>}</p>
                    <p className="text-xs text-stone-400">you get {fmt(p.ownerShareKobo)}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${p.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {p.status === 'success' ? (signed ? 'Paid · signed' : 'Paid · not yet signed') : 'Pending'}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
