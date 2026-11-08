import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { loadDB, updateDB, id, nowISO, type Payment } from '@/lib/store';
import { quote } from '@/lib/money';
import { MAX_SIGNATURES_PER_SHIRT } from '@/lib/signatures';

export const dynamic = 'force-dynamic';

// Creates a pending payment with a server-side quote. The client never sets
// prices: gift + size go in, the authoritative totals are computed here.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const db = loadDB();
  const shirt = db.shirts.find((s) => s.slug === body.slug);
  if (!shirt) return NextResponse.json({ error: 'Shirt not found.' }, { status: 404 });
  if (!String(body.contributorName || '').trim()) {
    return NextResponse.json({ error: 'Your name is required.' }, { status: 400 });
  }
  const sigCount = db.signatures.filter((s) => s.shirtId === shirt.id).length;
  if (sigCount >= MAX_SIGNATURES_PER_SHIRT) {
    return NextResponse.json({ error: 'This shirt is full — no more signatures fit.' }, { status: 409 });
  }
  const giftKobo = Math.round(Number(body.giftNaira) * 100);
  const q = quote(giftKobo, Number(body.size));
  if (!q.ok) return NextResponse.json({ error: q.error }, { status: 400 });

  const payment: Payment = {
    id: id('pay'),
    reference: `SO-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
    shirtId: shirt.id,
    contributorName: String(body.contributorName).trim().slice(0, 60),
    contributorEmail: String(body.contributorEmail || '').trim().slice(0, 120),
    giftKobo: q.giftKobo, size: q.size, surchargeKobo: q.surchargeKobo,
    totalKobo: q.totalKobo, platformFeeKobo: q.platformFeeKobo, ownerShareKobo: q.ownerShareKobo,
    status: 'pending', attempts: 0, createdAt: nowISO(),
  };
  updateDB((d) => { d.payments.push(payment); });
  return NextResponse.json({ ok: true, reference: payment.reference });
}
