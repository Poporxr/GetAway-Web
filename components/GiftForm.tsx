'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Loader2, Lock, Sparkles } from 'lucide-react';
import { fmt, quote, allowedSizes, MIN_GIFT_KOBO, SIZE_UNLOCK_KOBO } from '@/lib/money';
import { createCheckout } from '@/lib/localstore';

const CHIPS = [2000, 5000, 10000, 20000, 50000];

export default function GiftForm({ slug, ownerFirstName }: { slug: string; ownerFirstName: string }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gift, setGift] = useState<number>(2000);
  const [size, setSize] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const giftKobo = Math.round((gift || 0) * 100);
  const sizes = allowedSizes(giftKobo);
  const effectiveSize = sizes.includes(size) ? size : 1;
  const q = useMemo(() => quote(giftKobo, effectiveSize), [giftKobo, effectiveSize]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError('Please enter your name — it appears in the gift list.'); return; }
    if (!q.ok) { setError(q.error!); return; }
    setBusy(true);
    // Mockup: checkout is quoted and created in the local store.
    const result = createCheckout({ slug, contributorName: name.trim(), contributorEmail: email.trim(), giftNaira: gift, size: effectiveSize });
    if (!result.ok) {
      setError(result.error || 'Checkout failed. Please try again.');
      setBusy(false);
      return;
    }
    router.push(`/pay/${result.reference}`);
  };

  return (
    <form onSubmit={submit} className="card p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-stone-900">
        <Gift className="text-emerald-700" size={20} /> Gift {ownerFirstName} &amp; sign the shirt
      </h2>
      <p className="mt-1 text-sm text-stone-500">Pay first, then place your signature on the 3D shirt. No account needed.</p>

      <label className="label mt-5 block">Your name</label>
      <input
        value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tobi M."
        className="input mt-1.5"
      />
      <label className="label mt-4 block">Email <span className="font-medium normal-case tracking-normal text-stone-400">(optional — for your signing resume link)</span></label>
      <input
        value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" type="email"
        className="input mt-1.5"
      />

      <label className="label mt-5 block">Gift amount (₦)</label>
      <div className="mt-1 flex flex-wrap gap-2">
        {CHIPS.map((c) => (
          <button
            type="button" key={c} onClick={() => setGift(c)}
            className={`chip ${gift === c ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
          >
            ₦{c.toLocaleString()}
          </button>
        ))}
      </div>
      <input
        type="number" min={2000} step={100} value={gift || ''}
        onChange={(e) => setGift(Number(e.target.value))}
        className="input mt-2"
      />
      <p className="mt-1 text-xs text-stone-400">Minimum gift ₦2,000 · gifts of ₦5,000+ unlock bigger signatures</p>

      <label className="label mt-5 block">Signature size</label>
      <div className="mt-1 grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((s) => {
          const locked = !sizes.includes(s);
          const fee = [0, 500, 700, 1000][s - 1];
          return (
            <button
              type="button" key={s} disabled={locked}
              onClick={() => setSize(s)}
              className={`relative rounded-xl border px-2 py-2.5 text-center transition ${effectiveSize === s ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900' : 'border-stone-200 bg-white'} ${locked ? 'cursor-not-allowed opacity-45' : 'hover:border-stone-400'}`}
            >
              <span className="block text-base font-bold text-stone-900">{s}×</span>
              <span className="block text-[11px] font-medium text-stone-500">{fee ? `+₦${fee}` : 'included'}</span>
              {locked && <Lock size={12} className="absolute right-1.5 top-1.5 text-stone-400" />}
            </button>
          );
        })}
      </div>
      {giftKobo < SIZE_UNLOCK_KOBO && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-amber-600"><Sparkles size={12} /> Raise your gift to ₦5,000 to unlock 2×–4× signatures.</p>
      )}

      <div className="mt-5 space-y-1.5 rounded-xl bg-stone-50 p-4 text-sm ring-1 ring-stone-200/70">
        <div className="flex justify-between"><span className="text-stone-500">Gift</span><span className="font-semibold">{fmt(giftKobo)}</span></div>
        <div className="flex justify-between"><span className="text-stone-500">Signature size {effectiveSize}×</span><span className="font-semibold">{fmt(q.surchargeKobo)}</span></div>
        <div className="flex justify-between border-t border-stone-200 pt-1.5 text-base"><span className="font-semibold">Total to pay</span><span className="font-bold">{fmt(q.totalKobo)}</span></div>
        {q.ok && (
          <p className="pt-1 text-xs leading-relaxed text-stone-400">
            SignOut keeps a 10% platform fee ({fmt(q.platformFeeKobo)}) from the total; {ownerFirstName} receives {fmt(q.ownerShareKobo)}. No hidden charges.
          </p>
        )}
      </div>

      {error && <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</p>}

      <button
        type="submit" disabled={busy}
        className="btn-primary mt-4 w-full py-3.5"
      >
        {busy && <Loader2 className="animate-spin" size={16} />}
        Continue to payment →
      </button>
      <p className="mt-2.5 text-center text-[11px] font-medium uppercase tracking-wider text-stone-400">Test mode — mock checkout, no real money moves</p>
    </form>
  );
}
