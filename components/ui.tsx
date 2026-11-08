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
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
        <GraduationCap size={20} />
      </span>
      <span className={`text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-stone-900'}`}>
        Sign<span className="text-violet-600">Out</span>
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
      className="flex shrink-0 items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-700"
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

export function TestModeBanner() {
  return (
    <div className="bg-amber-400 px-4 py-1.5 text-center text-[12px] font-bold text-amber-950">
      TEST MODE · Prototype — payments are mocked, no real money moves
    </div>
  );
}
