import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { loadDB } from '@/lib/store';
import { fmt } from '@/lib/money';
import ShirtViewer from '@/components/ShirtViewer';
import { CopyButton } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function ShirtDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const db = loadDB();
  const shirt = db.shirts.find((s) => s.id === id && s.ownerId === user.id);
  if (!shirt) notFound();
  const sigs = db.signatures.filter((s) => s.shirtId === shirt.id);
  const gifts = db.payments
    .filter((p) => p.shirtId === shirt.id && p.status === 'success')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const url = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://signout.ng'}/s/${shirt.slug}`;
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div>
      <Link href="/dashboard" className="text-sm font-bold text-violet-700">← All shirts</Link>
      <div className="mt-3 grid gap-5 lg:grid-cols-5">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-b from-violet-50 to-amber-50 ring-1 ring-stone-200/70 lg:col-span-3">
          <ShirtViewer type={shirt.type} signatures={sigs} height={440} />
        </div>
        <div className="lg:col-span-2">
          <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70">
            <h2 className="font-extrabold text-stone-900">{shirt.type === 'tee' ? 'Classic Tee' : 'Long-Sleeve Shirt'}</h2>
            <p className="mt-1 text-sm text-stone-500">{sigs.length} signatures · {gifts.length} gifts · {fmt(gifts.reduce((a, p) => a + p.giftKobo, 0))} gifted</p>
            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-stone-50 p-2 pl-3">
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-600">{url}</span>
              <CopyButton text={url} />
            </div>
            <Link href={`/s/${shirt.slug}`} className="mt-3 inline-block rounded-full bg-stone-900 px-4 py-2 text-sm font-bold text-white">Open public page</Link>
          </div>
          <div className="mt-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-stone-200/70">
            <h3 className="font-bold text-stone-900">Signatures on this shirt</h3>
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
