'use client';

import { useState } from 'react';
import { Check, Copy, GraduationCap, Loader2 } from 'lucide-react';

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-stone-400">
      <Loader2 className="animate-spin" /> {label}
    </div>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-white">
        <GraduationCap size={20} />
      </span>
      <span className={`text-lg font-bold tracking-tight ${light ? 'text-white' : 'text-stone-900'}`}>
        Sign<span className="text-emerald-700">Out</span>
      </span>
    </span>
  );
}

export function CopyButton({ text, label = 'Copy link' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); } catch {
          const ta = document.createElement('textarea');
          ta.value = text; document.body.appendChild(ta); ta.select();
          document.execCommand('copy'); document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="btn-primary shrink-0 px-4 py-2.5"
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {copied ? 'Copied' : label}
    </button>
  );
}

export function TestModeBanner() {
  return (
    <div className="flex items-center justify-center gap-2 bg-stone-900 px-4 py-2 text-center text-[12px] font-medium text-stone-200">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
      Test mode · Prototype — payments are mocked, no real money moves
    </div>
  );
}
