'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { login, signup } from '@/lib/localstore';

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    // Mockup auth: accounts live in this browser's localStorage store.
    const result = mode === 'signup' ? signup({ name, email, password }) : login({ email, password });
    if (!result.ok) {
      setError(result.error || 'Something went wrong.');
      setBusy(false);
      return;
    }
    router.push(result.onboarded ? '/dashboard' : '/onboarding');
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-200/70 sm:p-8">
        <h1 className="text-2xl font-extrabold text-stone-900">{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
        <p className="mt-1 text-sm text-stone-500">
          {mode === 'signup' ? 'Two minutes to your own signing-out shirt link.' : 'Log in to your signing-out dashboard.'}
        </p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-stone-500">Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Adaeze Nwosu"
                className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
            </div>
          )}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-stone-500">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="you@example.com"
              className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-stone-500">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" placeholder="6+ characters"
              className="mt-1 w-full rounded-xl border border-stone-300 px-3.5 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100" />
          </div>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600">{error}</p>}
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-full bg-violet-600 py-3 text-sm font-bold text-white hover:bg-violet-700 disabled:opacity-50">
            {busy && <Loader2 className="animate-spin" size={16} />}
            {mode === 'signup' ? 'Create account' : 'Log in'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-stone-500">
          {mode === 'signup' ? (
            <>Already have an account? <Link href="/login" className="font-bold text-violet-700">Log in</Link></>
          ) : (
            <>New here? <Link href="/signup" className="font-bold text-violet-700">Create an account</Link></>
          )}
        </p>
        {mode === 'login' && (
          <div className="mt-5 rounded-2xl bg-violet-50 p-4 text-sm text-violet-900">
            <p className="font-bold">Just exploring?</p>
            <p className="mt-0.5 text-violet-800/80">Demo login — <span className="font-mono font-semibold">demo@signout.ng</span> / <span className="font-mono font-semibold">demo1234</span> — a dashboard with gifts and signatures already on it.</p>
          </div>
        )}
      </div>
    </div>
  );
}
