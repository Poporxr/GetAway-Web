'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, Plus } from 'lucide-react';
import { fmt } from '@/lib/money';

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/'); router.refresh(); }}
      className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-stone-500 hover:bg-stone-100"
    >
      <LogOut size={15} /> Log out
    </button>
  );
}

export function CreateShirtButton({ type, label }: { type: 'tee' | 'longsleeve'; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        disabled={busy}
        onClick={async () => {
          setBusy(true); setError(null);
          const res = await fetch('/api/shirts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type }) });
          const j = await res.json();
          if (!res.ok) { setError(j.error); setBusy(false); return; }
          router.refresh();
        }}
        className="flex items-center gap-2 rounded-full bg-violet-600 px-5 py-3 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {busy ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} {label}
      </button>
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}

const inputCls = 'mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100';
const labelCls = 'text-xs font-bold uppercase tracking-wide text-stone-500';

export function VerificationForm() {
  const router = useRouter();
  const [idType, setIdType] = useState('Student ID card');
  const [idNumber, setIdNumber] = useState('');
  const [evidenceName, setEvidenceName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setError(null);
        const res = await fetch('/api/verification', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idType, idNumber, evidenceName: evidenceName || `${idType} (file name not captured)` }) });
        const j = await res.json();
        if (!res.ok) { setError(j.error); setBusy(false); return; }
        router.refresh();
      }}
    >
      <div>
        <label className={labelCls}>ID type</label>
        <select value={idType} onChange={(e) => setIdType(e.target.value)} className={inputCls}>
          <option>Student ID card</option>
          <option>National ID (NIN slip)</option>
          <option>School admission letter</option>
          <option>Final-year clearance form</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>ID / matric number</label>
        <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} required placeholder="e.g. UIL/2021/0042" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Evidence file</label>
        <input type="file" accept="image/*,.pdf" onChange={(e) => setEvidenceName(e.target.files?.[0]?.name ?? '')} className="mt-1 block w-full text-sm text-stone-500 file:mr-3 file:rounded-full file:border-0 file:bg-violet-100 file:px-4 file:py-2 file:text-sm file:font-bold file:text-violet-700" />
        <p className="mt-1 text-xs text-stone-400">Prototype: the file name is recorded; the file itself is not uploaded or stored.</p>
      </div>
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}
      <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50">
        {busy && <Loader2 className="animate-spin" size={16} />} Submit for review
      </button>
    </form>
  );
}

export function WithdrawForm({ availableKobo, bankLine }: { availableKobo: number; bankLine: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setError(null); setDone(null);
        const res = await fetch('/api/withdrawals', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amountNaira: Number(amount), idempotencyKey: `wd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }),
        });
        const j = await res.json();
        if (!res.ok) { setError(j.error); setBusy(false); return; }
        setDone(`Withdrawal of ${fmt(j.withdrawal.amountKobo)} requested — status: pending payout.`);
        setAmount('');
        setBusy(false);
        router.refresh();
      }}
    >
      <div>
        <label className={labelCls}>Amount (₦) — available {fmt(availableKobo)}</label>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min={100} step={50} required placeholder="e.g. 5000" className={inputCls} />
      </div>
      <p className="text-xs text-stone-400">Payout goes to {bankLine}. Minimum ₦100.</p>
      {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}
      {done && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{done}</p>}
      <button disabled={busy || availableKobo <= 0} className="flex w-full items-center justify-center gap-2 rounded-full bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-40">
        {busy && <Loader2 className="animate-spin" size={16} />} Request withdrawal
      </button>
    </form>
  );
}
