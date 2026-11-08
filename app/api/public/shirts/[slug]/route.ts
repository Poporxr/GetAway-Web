import { NextResponse } from 'next/server';
import { loadDB } from '@/lib/store';
import { MAX_SIGNATURES_PER_SHIRT } from '@/lib/signatures';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = loadDB();
  const shirt = db.shirts.find((s) => s.slug === slug);
  if (!shirt) return NextResponse.json({ error: 'Shirt not found.' }, { status: 404 });
  const owner = db.users.find((u) => u.id === shirt.ownerId);
  const profile = db.profiles.find((p) => p.userId === shirt.ownerId);
  const signatures = db.signatures.filter((s) => s.shirtId === shirt.id);
  const gifts = db.payments
    .filter((p) => p.shirtId === shirt.id && p.status === 'success')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((p) => ({ contributorName: p.contributorName, giftKobo: p.giftKobo, size: p.size, createdAt: p.createdAt }));
  return NextResponse.json({
    shirt: { id: shirt.id, type: shirt.type, slug: shirt.slug },
    owner: { name: owner?.name ?? 'A graduate', school: profile?.school ?? '', department: profile?.department ?? '' },
    signatures,
    gifts,
    giftCount: gifts.length,
    full: signatures.length >= MAX_SIGNATURES_PER_SHIRT,
  });
}
