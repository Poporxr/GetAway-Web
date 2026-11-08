import { NextResponse } from 'next/server';
import { loadDB } from '@/lib/store';
import { settlePayment, recordFailedAttempt } from '@/lib/payments';

export const dynamic = 'force-dynamic';

// MOCK gateway confirm. In production this endpoint does not exist: Paystack
// redirects back and settlement happens in settlePayment() via the signed
// webhook / server verification with the gateway-confirmed amount.
export async function POST(req: Request, { params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const { outcome } = await req.json().catch(() => ({}));
  const db = loadDB();
  const payment = db.payments.find((p) => p.reference === reference);
  if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
  if (outcome === 'failure') {
    recordFailedAttempt(reference);
    return NextResponse.json({ ok: false, error: 'The mock bank declined this card. Try the test card to succeed.' }, { status: 402 });
  }
  if (outcome !== 'success') return NextResponse.json({ error: 'Invalid outcome.' }, { status: 400 });
  // The mock gateway "verifies" the exact quoted total, like Paystack's verify would.
  const result = settlePayment(reference, payment.totalKobo);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, entitlementToken: result.entitlement.token });
}
