'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Check, Landmark, Loader2, Percent, School } from 'lucide-react';
import { UNIVERSITIES, BANKS } from '@/lib/lists';
import { POLICY_VERSION } from '@/lib/money';
import { getSessionUserId, onboardingStep } from '@/lib/localstore';

interface Initial { school: string; department: string; bankName: string; bankCode: string; accountNumber: string; accountName: string }

const inputCls = 'input mt-1.5';
const labelCls = 'label';

export default function OnboardingWizard({ initial }: { initial: Initial }) {
  const router = useRouter();
  const startStep = !initial.school ? 0 : !initial.bankName ? 1 : 2;
  const [step, setStep] = useState(startStep);
  const [schoolSel, setSchoolSel] = useState(UNIVERSITIES.includes(initial.school) || !initial.school ? initial.school : '__other__');
  const [schoolOther, setSchoolOther] = useState(UNIVERSITIES.includes(initial.school) ? '' : initial.school);
  const [department, setDepartment] = useState(initial.department);
  const [bankCode, setBankCode] = useState(initial.bankCode);
  const [accountNumber, setAccountNumber] = useState(initial.accountNumber);
  const [accountName, setAccountName] = useState(initial.accountName);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const post = async (payload: object) => {
    setBusy(true); setError(null);
    // Mockup: onboarding steps are validated and saved in the local store.
    const userId = getSessionUserId();
    if (!userId) { setError('Not signed in.'); setBusy(false); router.push('/login'); return false; }
    const result = onboardingStep(userId, payload);
    setBusy(false);
    if (!result.ok) { setError(result.error || 'Could not save. Try again.'); return false; }
    return true;
  };

  const stepsMeta = [
    { icon: School, label: 'School' },
    { icon: Landmark, label: 'Bank account' },
    { icon: Percent, label: 'Platform fee' },
  ];

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-center text-2xl font-bold tracking-tight text-stone-900">Set up your signing-out shirts</h1>
      <p className="mt-1 text-center text-sm text-stone-500">Three quick steps, then your dashboard and shareable links.</p>

      <div className="mt-6 flex items-center justify-center gap-2">
        {stepsMeta.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${i < step ? 'bg-emerald-50 text-emerald-700' : i === step ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400'}`}>
              {i < step ? <Check size={13} /> : <s.icon size={13} />} {s.label}
            </span>
            {i < 2 && <span className="h-px w-6 bg-stone-300" />}
          </div>
        ))}
      </div>

      <div className="card mt-6 p-6">
        {error && <p className="mb-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</p>}

        {step === 0 && (
          <form onSubmit={async (e) => { e.preventDefault(); const school = schoolSel === '__other__' ? schoolOther.trim() : schoolSel; if (await post({ step: 'school', school, department })) setStep(1); }} className="space-y-3">
            <div>
              <label className={labelCls}>University / institution</label>
              <select value={schoolSel} onChange={(e) => setSchoolSel(e.target.value)} required className={inputCls}>
                <option value="" disabled>Select your school</option>
                {UNIVERSITIES.map((u) => <option key={u} value={u}>{u}</option>)}
                <option value="__other__">Other (type it below)</option>
              </select>
            </div>
            {schoolSel === '__other__' && (
              <div>
                <label className={labelCls}>School name</label>
                <input value={schoolOther} onChange={(e) => setSchoolOther(e.target.value)} required placeholder="Your institution" className={inputCls} />
              </div>
            )}
            <div>
              <label className={labelCls}>Department</label>
              <input value={department} onChange={(e) => setDepartment(e.target.value)} required placeholder="e.g. Computer Science" className={inputCls} />
            </div>
            <button disabled={busy} className="btn-primary w-full">
              {busy && <Loader2 className="animate-spin" size={16} />} Continue →
            </button>
          </form>
        )}

        {step === 1 && (
          <form onSubmit={async (e) => { e.preventDefault(); const bank = BANKS.find((b) => b.code === bankCode); if (await post({ step: 'bank', bankName: bank?.name, bankCode, accountNumber, accountName })) setStep(2); }} className="space-y-3">
            <div>
              <label className={labelCls}>Bank</label>
              <select value={bankCode} onChange={(e) => setBankCode(e.target.value)} required className={inputCls}>
                <option value="" disabled>Select your bank</option>
                {BANKS.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Account number</label>
              <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))} required inputMode="numeric" placeholder="10 digits" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Account name</label>
              <input value={accountName} onChange={(e) => setAccountName(e.target.value)} required placeholder="Name on the account" className={inputCls} />
            </div>
            <p className="flex items-start gap-1.5 text-xs leading-relaxed text-stone-400"><Building2 size={14} className="mt-0.5 shrink-0" /> This is where your gift money is paid out after verification. In a production build the name is confirmed with a bank lookup before saving.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(0)} className="btn-secondary">Back</button>
              <button disabled={busy} className="btn-primary flex-1">
                {busy && <Loader2 className="animate-spin" size={16} />} Continue →
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={async (e) => { e.preventDefault(); if (await post({ step: 'commission', accepted })) { router.push('/dashboard'); } }}>
            <div className="rounded-xl bg-stone-50 p-4 text-sm leading-relaxed text-stone-700 ring-1 ring-stone-200/80">
              <p className="font-bold">The one fee, in plain words</p>
              <p className="mt-1">SignOut keeps <strong>10% of every successful gift payment</strong> as a platform commission. The remaining 90% is yours. The fee is calculated on the full amount paid (gift + any signature-size surcharge) and is shown to contributors before they pay — no hidden charges, ever.</p>
              <p className="mt-2 text-xs text-stone-400">Policy version {POLICY_VERSION}. Your acknowledgement and its timestamp are stored on your account.</p>
            </div>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-stone-200 p-4">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-emerald-700" />
              <span className="text-sm text-stone-700">I understand and accept the <strong>10% platform commission</strong> on every successful payment.</span>
            </label>
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary">Back</button>
              <button disabled={busy || !accepted} className="btn-primary flex-1">
                {busy && <Loader2 className="animate-spin" size={16} />} Finish — go to my dashboard
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
