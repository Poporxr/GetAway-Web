'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { GraduationCap, PenLine, Shirt as ShirtIcon } from 'lucide-react';
import { useClientDB } from '@/lib/hooks';
import { getPublicShirt } from '@/lib/localstore';
import { fmt } from '@/lib/money';
import ShirtViewer from '@/components/ShirtViewer';
import GiftForm from '@/components/GiftForm';
import { LoadingBlock } from '@/components/ui';

export default function PublicShirtPage() {
  const params = useParams();
  const slug = String(params.slug ?? '');
  const { ready } = useClientDB();
  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl px-4 pb-16"><LoadingBlock label="Loading the shirt…" /></div>
    );
  }

  const result = getPublicShirt(slug);
  if (!result.ok) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <ShirtIcon className="mx-auto text-stone-300" size={44} />
        <h1 className="mt-3 text-xl font-bold text-stone-800">Shirt not found</h1>
        <p className="mt-1 text-sm text-stone-500">This link does not match any shirt in this browser&apos;s store. Mockup data lives per device, so a link created on another device will not resolve here.</p>
        <Link href="/" className="mt-4 inline-block rounded-full bg-violet-600 px-6 py-3 text-sm font-bold text-white">Go home</Link>
      </div>
    );
  }

  const { shirt, owner, signatures, gifts, full } = result.view;
  const firstName = owner.name.split(' ')[0];
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <div className="pt-8 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-violet-600 font-hand text-3xl font-bold text-white shadow-sm">
          {firstName.charAt(0)}
        </span>
        <h1 className="mt-3 text-3xl font-extrabold text-stone-900">{owner.name}&apos;s signing-out shirt</h1>
        <p className="mt-1 flex flex-wrap items-center justify-center gap-x-2 text-sm text-stone-500">
          <GraduationCap size={15} /> {owner.department} · {owner.school}
        </p>
        <p className="mt-2 text-sm font-semibold text-violet-700">
          {signatures.length} signatures so far · {gifts.length} gifts · {shirt.type === 'tee' ? 'Classic Tee' : 'Long-Sleeve Shirt'}
        </p>
      </div>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-5">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-b from-violet-100 via-paper to-amber-100 ring-1 ring-stone-200/70 lg:col-span-3">
          <ShirtViewer type={shirt.type} signatures={signatures} height={470} />
          <p className="pb-4 text-center text-xs text-stone-400">Drag to spin · use Front / Back to flip · scroll or pinch to zoom</p>
        </div>

        <div className="space-y-4 lg:col-span-2">
          {full ? (
            <div className="rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-stone-200/70">
              <ShirtIcon className="mx-auto text-violet-500" size={36} />
              <h2 className="mt-2 font-extrabold text-stone-900">This shirt is full! 🎉</h2>
              <p className="mt-1 text-sm text-stone-500">Every space has been signed. {firstName} is one loved graduate.</p>
            </div>
          ) : (
            <GiftForm slug={shirt.slug} ownerFirstName={firstName} />
          )}

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70">
            <h3 className="flex items-center gap-2 font-bold text-stone-900"><PenLine size={16} className="text-violet-600" /> Fresh ink</h3>
            {signatures.length === 0 ? (
              <p className="mt-2 text-sm text-stone-400">No signatures yet — yours could be the first.</p>
            ) : (
              <ul className="mt-2 divide-y divide-stone-100">
                {[...signatures].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6).map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full ring-1 ring-stone-200" style={{ backgroundColor: s.color }} />
                      <span className="font-semibold text-stone-700">{s.contributorName}</span>
                    </span>
                    <span className="text-xs capitalize text-stone-400">{s.surface} · {s.size}× · {fmtDate(s.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70">
            <h3 className="font-bold text-stone-900">Recent gifts</h3>
            {gifts.length === 0 ? (
              <p className="mt-2 text-sm text-stone-400">No gifts yet.</p>
            ) : (
              <ul className="mt-2 divide-y divide-stone-100">
                {gifts.slice(0, 6).map((g) => (
                  <li key={g.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-semibold text-stone-700">{g.contributorName}</span>
                    <span className="font-bold text-stone-900">{fmt(g.giftKobo)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
