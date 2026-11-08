'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, CreditCard, Loader2, Lock, ShieldCheck, XCircle } from 'lucide-react';
import { fmt } from '@/lib/money';

interface PaymentView {
  reference: string; contributorName: string; giftKobo: number; surchargeKobo: number;
  totalKobo: number; platformFeeKobo: number; ownerShareKobo: number; size: number;
  status: string; attempts: number; entitlementToken: string | null; entitlementUsed: string | null;
  shirtSlug: string; ownerName: string;
}

const TEST_CARD = '4084 0840 8408 4081';

export default function PayClient({ reference }: { reference: string }) {
  const [pay, setPay] = useState<PaymentView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [busy, setBusy] = useState(false);
  const [failMsg, setFailMsg] = useState<string | null>(null);

  const load = () => {
    fetch(`/api/payments/${reference}`)
      .then(async (r) => { const j = await r.json(); if (!r.ok) throw new Error(j.error); setPay(j); })
      .catch((e) => setLoadError(e.message));
  };
  useEffect(load, [reference]);

  const attempt = async (forceFail: boolean) => {
    setBusy(true); setFailMsg(null);
    await new Promise((r) => setTimeout(r, 900)); // simulate gateway processing
    const succeed = !forceFail && card.replace(/\s/g, '') === TEST_CARD.replace(/\s/g, '');
    const res = await fetch(`/api/payments/${reference}/confirm`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome: succeed ? 'success' : 'failure' }),
    });
    const j = await res.json();
    setBusy(false);
    if (!succeed) {
      setFailMsg('Declined by the mock bank. Use the test card number below to simulate a successful payment.');
      load();
      return;
    }
    if (!res.ok) { setFailMsg(j.error || 'Payment failed.'); return; }
    load();
  };

  if (loadError) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <XCircle className="mx-auto text-red-400" size={44} />
        <h1 className="mt-3 text-xl font-bold">Payment not found</h1>
        <p className="mt-1 text-sm text-stone-500">{loadError}</p>
      </div>
    );
  }
  if (!pay) return <div className="flex items-center justify-center gap-2 py-24 text-stone-400"><Loader2 className="animate-spin" /> Loading checkout…</div>;

  if (pay.status === 'success' && pay.entitlementToken && !pay.entitlementUsed) {
    return (
      <div className="mx-auto max-w-md px-4 py-14">
        <div className="rounded-3xl bg-white p-7 text-center shadow-sm ring-1 ring-stone-200/70">
          <CheckCircle2 className="mx-auto text-emerald-500" size={50} />
          <h1 className="mt-3 text-2xl font-extrabold text-stone-900">Payment successful 🎉</h1>
          <p className="mt-1 text-sm text-stone-500">
            {fmt(pay.totalKobo)} paid. {pay.ownerName.split(' ')[0]} receives {fmt(pay.ownerShareKobo)} after the disclosed 10% platform fee ({fmt(pay.platformFeeKobo)}).
          </p>
          <Link href={`/sign/${pay.entitlementToken}`} className="mt-5 block rounded-full bg-violet-600 py-3.5 text-sm font-bold text-white hover:bg-violet-700">
            Sign the shirt now →
          </Link>
          <div className="mt-4 rounded-2xl bg-stone-50 p-3 text-left">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Lost this page? Your resume link</p>
            <p className="mt-1 break-all font-mono text-xs text-stone-600">/sign/{pay.entitlementToken}</p>
            <p className="mt-1 text-xs text-stone-400">Keep it — it is the only key to your unused signing pass (valid 24 hours).</p>
          </div>
        </div>
      </div>
    );
  }
  if (pay.status === 'success' && pay.entitlementUsed) {
    return (
      <div className="mx-auto max-w-md px-4 py-14 text-center">
        <CheckCircle2 className="mx-auto text-emerald-500" size={46} />
        <h1 className="mt-3 text-xl font-bold">Already signed ✓</h1>
        <p className="mt-1 text-sm text-stone-500">This payment&apos;s signature is already on the shirt.</p>
        <Link href={`/s/${pay.shirtSlug}`} className="mt-4 inline-block rounded-full bg-violet-600 px-6 py-3 text-sm font-bold text-white">See the shirt</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-200/70">
        <div className="bg-stone-900 px-6 py-4 text-white">
          <p className="flex items-center gap-2 text-sm font-bold"><Lock size={15} /> Secure checkout</p>
          <p className="mt-0.5 text-xs text-stone-400">Mock gateway — styled like Paystack. Test mode: no real charge.</p>
        </div>
        <div className="p-6">
          <div className="space-y-1.5 rounded-2xl bg-stone-50 p-4 text-sm">
            <div className="flex justify-between"><span className="text-stone-500">Gift for {pay.ownerName}</span><span className="font-semibold">{fmt(pay.giftKobo)}</span></div>
            <div className="flex justify-between"><span className="text-stone-500">Signature size {pay.size}×</span><span className="font-semibold">{fmt(pay.surchargeKobo)}</span></div>
            <div className="flex justify-between border-t border-stone-200 pt-1.5"><span className="font-bold">Total</span><span className="font-extrabold">{fmt(pay.totalKobo)}</span></div>
            <p className="text-xs text-stone-400">Ref {pay.reference} · paying as {pay.contributorName}</p>
          </div>

          <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-stone-500">Card number</label>
          <div className="relative">
            <input
              value={card}
              onChange={(e) => setCard(e.target.value.replace(/[^\d]/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19))}
              placeholder="4084 0840 8408 4081" inputMode="numeric"
              className="mt-1 w-full rounded-xl border border-stone-300 py-2.5 pl-3.5 pr-10 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
            <CreditCard className="absolute right-3 top-1/2 -translate-y-1/3 text-stone-300" size={18} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-stone-500">Expiry</label>
              <input value={expiry} onChange={(e) => setExpiry(e.target.value.slice(0, 5))} placeholder="12/28"
                className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-stone-500">CVV</label>
              <input value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="408" inputMode="numeric"
                className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
            </div>
          </div>

          {failMsg && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{failMsg}</p>}
          {pay.attempts > 0 && <p className="mt-2 text-xs text-stone-400">{pay.attempts} failed attempt{pay.attempts > 1 ? 's' : ''} on this payment — you can keep trying.</p>}

          <button
            disabled={busy || card.replace(/\s/g, '').length < 12}
            onClick={() => attempt(false)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-40"
          >
            {busy && <Loader2 className="animate-spin" size={16} />} Pay {fmt(pay.totalKobo)}
          </button>
          <button disabled={busy} onClick={() => attempt(true)} className="mt-2 w-full rounded-full py-2 text-xs font-semibold text-stone-400 hover:text-red-500">
            Simulate a declined card instead
          </button>

          <div className="mt-3 rounded-2xl bg-violet-50 p-3 text-xs leading-relaxed text-violet-900">
            <p className="flex items-center gap-1 font-bold"><ShieldCheck size={13} /> How to test</p>
            <p className="mt-0.5">Card <span className="font-mono font-bold">{TEST_CARD}</span> with any future expiry and CVV succeeds. Any other card is declined by the mock bank.</p>
          </div>
          <Link href={`/s/${pay.shirtSlug}`} className="mt-4 block text-center text-sm font-semibold text-stone-400 hover:text-stone-600">← Back to the shirt</Link>
        </div>
      </div>
    </div>
  );
}
