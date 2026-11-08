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
      <div className="card p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-stone-500">
          {mode === 'signup' ? 'Two minutes to your own signing-out shirt link.' : 'Log in to your signing-out dashboard.'}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="label">Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Adaeze Nwosu" className="input mt-1.5" />
            </div>
          )}
          <div>
            <label className="label">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" placeholder="you@example.com" className="input mt-1.5" />
          </div>
          <div>
            <label className="label">Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" placeholder="6+ characters" className="input mt-1.5" />
          </div>
          {error && <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</p>}
          <button disabled={busy} className="btn-primary w-full py-3">
            {busy && <Loader2 className="animate-spin" size={16} />}
            {mode === 'signup' ? 'Create account' : 'Log in'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-stone-500">
          {mode === 'signup' ? (
            <>Already have an account? <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">Log in</Link></>
          ) : (
            <>New here? <Link href="/signup" className="font-semibold text-emerald-700 hover:text-emerald-800">Create an account</Link></>
          )}
        </p>
        {mode === 'login' && (
          <div className="mt-6 rounded-xl bg-stone-50 p-4 text-sm text-stone-600 ring-1 ring-stone-200/80">
            <p className="font-semibold text-stone-800">Just exploring?</p>
            <p className="mt-0.5 leading-relaxed">Demo login — <span className="font-mono font-semibold">demo@signout.ng</span> / <span className="font-mono font-semibold">demo1234</span> — a dashboard with gifts and signatures already on it.</p>
          </div>
        )}
      </div>
    </div>
  );
}
