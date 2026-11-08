'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useClientDB } from '@/lib/hooks';
import { getSessionUserId } from '@/lib/localstore';
import { fmt } from '@/lib/money';
import ShirtViewer from '@/components/ShirtViewer';
import { CopyButton, LoadingBlock } from '@/components/ui';

export default function ShirtDetailPage() {
  const params = useParams();
  const id = String(params.id ?? '');
  const { ready, db } = useClientDB();
  const userId = ready ? getSessionUserId() : null;
  if (!ready || !db) return <LoadingBlock />;

  const shirt = db.shirts.find((s) => s.id === id && s.ownerId === userId);
  if (!shirt) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-xl font-bold tracking-tight text-stone-900">Shirt not found</h2>
        <p className="mt-1 text-sm text-stone-500">This shirt does not exist in this browser&apos;s store, or it is not yours.</p>
        <Link href="/dashboard" className="btn-primary mt-4">All shirts</Link>
      </div>
    );
  }
  const sigs = db.signatures.filter((s) => s.shirtId === shirt.id);
  const gifts = db.payments
    .filter((p) => p.shirtId === shirt.id && p.status === 'success')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const url = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://signout.ng'}/s/${shirt.slug}`;
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div>
      <Link href="/dashboard" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">← All shirts</Link>
      <div className="mt-3 grid gap-5 lg:grid-cols-5">
        <div className="card overflow-hidden lg:col-span-3"><div className="bg-[#f4f4f2]">
          <ShirtViewer type={shirt.type} signatures={sigs} height={440} />
        </div></div>
        <div className="lg:col-span-2">
          <div className="card p-5">
            <h2 className="font-semibold tracking-tight text-stone-900">{shirt.type === 'tee' ? 'Classic Tee' : 'Button-Down Shirt'}</h2>
            <p className="mt-1 text-sm text-stone-500">{sigs.length} signatures · {gifts.length} gifts · {fmt(gifts.reduce((a, p) => a + p.giftKobo, 0))} gifted</p>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-stone-50 p-2 pl-3 ring-1 ring-stone-200/70">
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-600">{url}</span>
              <CopyButton text={url} />
            </div>
            <Link href={`/s/${shirt.slug}`} className="btn-primary mt-3 px-4 py-2">Open public page</Link>
          </div>
          <div className="card mt-4 p-5">
            <h3 className="font-semibold tracking-tight text-stone-900">Signatures on this shirt</h3>
            {sigs.length === 0 ? (
              <p className="mt-2 text-sm text-stone-400">None yet — share your link and the ink will come.</p>
            ) : (
              <ul className="mt-2 divide-y divide-stone-100">
                {sigs.map((s) => (
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
        </div>
      </div>
    </div>
  );
}
