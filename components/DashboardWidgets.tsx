'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, Plus } from 'lucide-react';
import { fmt } from '@/lib/money';
import {
  createShirt as createShirtLocal,
  getSessionUserId,
  logout as logoutLocal,
  requestWithdrawal as requestWithdrawalLocal,
  submitVerification as submitVerificationLocal,
} from '@/lib/localstore';

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => { logoutLocal(); router.push('/'); }}
      className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-stone-500 hover:bg-stone-100"
    >
      <LogOut size={15} /> Log out
    </button>
  );
}

export function CreateShirtButton({ type, label, onCreated }: { type: 'tee' | 'longsleeve'; label: string; onCreated?: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div>
      <button
        disabled={busy}
        onClick={() => {
          const userId = getSessionUserId();
          if (!userId) { router.push('/login'); return; }
          setBusy(true); setError(null);
          const result = createShirtLocal(userId, type);
          if (!result.ok) { setError(result.error); setBusy(false); return; }
          setBusy(false);
          if (onCreated) onCreated();
        }}
        className="btn-primary"
      >
        {busy ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} {label}
      </button>
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}

const inputCls = 'input mt-1.5';
const labelCls = 'label';

export function VerificationForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const router = useRouter();
  const [idType, setIdType] = useState('Student ID card');
  const [idNumber, setIdNumber] = useState('');
  const [evidenceName, setEvidenceName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const userId = getSessionUserId();
        if (!userId) { router.push('/login'); return; }
        setBusy(true); setError(null);
        const result = submitVerificationLocal(userId, { idType, idNumber, evidenceName: evidenceName || `${idType} (file name not captured)` });
        if (!result.ok) { setError(result.error); setBusy(false); return; }
        setBusy(false);
        if (onSubmitted) onSubmitted();
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
        <input type="file" accept="image/*,.pdf" onChange={(e) => setEvidenceName(e.target.files?.[0]?.name ?? '')} className="mt-1 block w-full text-sm text-stone-500 file:mr-3 file:rounded-full file:border-0 file:bg-stone-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-stone-700" />
        <p className="mt-1 text-xs text-stone-400">Prototype: the file name is recorded; the file itself is not uploaded or stored.</p>
      </div>
      {error && <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</p>}
      <button disabled={busy} className="btn-primary w-full">
        {busy && <Loader2 className="animate-spin" size={16} />} Submit for review
      </button>
    </form>
  );
}

export function WithdrawForm({ availableKobo, bankLine, onDone }: { availableKobo: number; bankLine: string; onDone?: () => void }) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const userId = getSessionUserId();
        if (!userId) { router.push('/login'); return; }
        setBusy(true); setError(null); setDone(null);
        const result = requestWithdrawalLocal(userId, { amountNaira: Number(amount), idempotencyKey: `wd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
        if (!result.ok) { setError(result.error); setBusy(false); return; }
        setDone(`Withdrawal of ${fmt(result.withdrawal.amountKobo)} requested — status: pending payout.`);
        setAmount('');
        setBusy(false);
        if (onDone) onDone();
      }}
    >
      <div>
        <label className={labelCls}>Amount (₦) — available {fmt(availableKobo)}</label>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min={100} step={50} required placeholder="e.g. 5000" className={inputCls} />
      </div>
      <p className="text-xs text-stone-400">Payout goes to {bankLine}. Minimum ₦100.</p>
      {error && <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</p>}
      {done && <p className="rounded-xl bg-emerald-50 px-3.5 py-2.5 text-sm font-medium text-emerald-700">{done}</p>}
      <button disabled={busy || availableKobo <= 0} className="btn-primary w-full">
        {busy && <Loader2 className="animate-spin" size={16} />} Request withdrawal
      </button>
    </form>
  );
}
