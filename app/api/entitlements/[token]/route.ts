import { NextResponse } from 'next/server';
import { loadDB } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = loadDB();
  const ent = db.entitlements.find((e) => e.token === token);
  if (!ent) return NextResponse.json({ error: 'This signing link is not valid.' }, { status: 404 });
  if (ent.usedAt) return NextResponse.json({ error: 'This signing pass has already been used — one signature per gift.' }, { status: 409 });
  if (new Date(ent.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: 'This signing pass has expired. Your payment is safe — contact the shirt owner.' }, { status: 410 });
  }
  const shirt = db.shirts.find((s) => s.id === ent.shirtId);
  const payment = db.payments.find((p) => p.id === ent.paymentId);
  const owner = db.users.find((u) => u.id === shirt?.ownerId);
  const profile = db.profiles.find((p) => p.userId === shirt?.ownerId);
  if (!shirt || !payment) return NextResponse.json({ error: 'Signing pass is incomplete.' }, { status: 500 });
  return NextResponse.json({
    shirt: { id: shirt.id, type: shirt.type, slug: shirt.slug },
    owner: { name: owner?.name ?? '', school: profile?.school ?? '', department: profile?.department ?? '' },
    contributorName: payment.contributorName,
    size: ent.size,
    expiresAt: ent.expiresAt,
    signatures: db.signatures.filter((s) => s.shirtId === shirt.id),
  });
}
