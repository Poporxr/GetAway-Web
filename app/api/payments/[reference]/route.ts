import { NextResponse } from 'next/server';
import { loadDB } from '@/lib/store';
import { publicPaymentView } from '@/lib/payments';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const db = loadDB();
  const payment = db.payments.find((p) => p.reference === reference);
  if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
  const shirt = db.shirts.find((s) => s.id === payment.shirtId);
  const owner = db.users.find((u) => u.id === shirt?.ownerId);
  return NextResponse.json({
    ...publicPaymentView(db, payment),
    shirtSlug: shirt?.slug ?? '',
    ownerName: owner?.name ?? '',
  });
}
